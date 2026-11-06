// backend/src/controllers/gamification.controller.js
const User = require('../models/user.model');
const catalog = require('../data/avatarCatalog.json');

const START_COINS = 500;
const DAILY_XP = 20;

const levelOf = (xp) => Math.floor((xp || 0) / 100) + 1;
const HEX = /^[0-9a-fA-F]{6}$/;

const getTodayStr = () => new Date().toISOString().split('T')[0];
const getYesterdayStr = () => new Date(Date.now() - 864e5).toISOString().split('T')[0];

const uid = (req) => {
  if (!req.user) return null;
  return req.user._id || req.user.id || req.user.userId;
};

async function ensureInit(id) {
  if (!id) return;
  await User.updateOne({ _id: id, coins: { $exists: false } }, {$set: { coins: START_COINS } });
}

function serialize(u) {
  const av = u.avatar || null;
  const today = getTodayStr();
  return {
    name: u.name,
    coins: u.coins ?? START_COINS,
    xp: u.xp || 0,
    level: levelOf(u.xp),
    streak: u.streak || 0,
    lastDailyClaim: u.lastDailyClaim || '',
    canClaimDaily: (u.lastDailyClaim || '') !== today,
    owned: u.ownedItems || [],
    avatar: av,
    avatar_config: av,
    avatarConfig: av,
    avatarUrl: u.avatarUrl || ''
  };
}

const fail = (res, code, message) => res.status(code).json({ message });
const serverError = (res, e) => res.status(500).json({ message: 'Eroare server.', error: e.message });

function usable(id, level, owned) {
  if (id === 'none') return true;
  const it = catalog.items[id];
  if (!it) return false;
  if (it.lvl && level < it.lvl) return false;
  return it.price === 0 || owned.has(id);
}

// GET /api/gamification/me
exports.getMe = async (req, res) => {
  try {
    const userId = uid(req);
    if (!userId) return fail(res, 401, 'Utilizator neautentificat.');
    await ensureInit(userId);
    const u = await User.findById(userId);
    if (!u) return fail(res, 404, 'Utilizator inexistent.');
    res.json(serialize(u));
  } catch (e) { serverError(res, e); }
};

// POST /api/gamification/avatar
exports.saveAvatar = async (req, res) => {
  try {
    const userId = uid(req);
    if (!userId) return fail(res, 401, 'Utilizator neautentificat.');

    const body = req.body || {};
    const config = body.avatarConfig || body.avatar_config || body.avatar || body;
    const { equip, skin, hairColor, bg } = config || {};
    const avatarUrl = body.avatarUrl || config.avatarUrl || '';

    if (!equip || typeof equip !== 'object') return fail(res, 400, 'Configurație invalidă.');

    const cleanSkin = (skin || '').replace('#', '');
    const cleanHair = (hairColor || '').replace('#', '');
    const cleanBg = (bg || '').replace('#', '');

    if (![cleanSkin, cleanHair, cleanBg].every((c) => typeof c === 'string' && HEX.test(c))) {
      return fail(res, 400, 'Culori invalide.');
    }

    const u = await User.findById(userId);
    if (!u) return fail(res, 404, 'Utilizator inexistent.');

    const level = levelOf(u.xp), owned = new Set(u.ownedItems || []);
    const cleanEquip = {};

    for (const [slot, id] of Object.entries(equip)) {
      if (id === 'none') {
        cleanEquip[slot] = 'none';
        continue;
      }
      const it = catalog.items[id];
      if (!it || it.slot !== slot) return fail(res, 400, `Item invalid: ${id}`);
      if (!usable(id, level, owned)) return fail(res, 403, `Nu poți folosi încă „${id}".`);
      cleanEquip[slot] = id;
    }

    u.avatar = { equip: cleanEquip, skin: cleanSkin, hairColor: cleanHair, bg: cleanBg };
    u.avatarUrl = avatarUrl;
    u.markModified('avatar');
    await u.save();

    res.json(serialize(u));
  } catch (e) { serverError(res, e); }
};

// POST /api/gamification/shop/buy
exports.buy = async (req, res) => {
  try {
    const userId = uid(req);
    if (!userId) return fail(res, 401, 'Utilizator neautentificat.');
    const ids = [...new Set((req.body && req.body.itemIds) || [])];
    if (!ids.length || ids.length > 20) return fail(res, 400, 'Lista de item-uri e invalidă.');

    await ensureInit(userId);
    const u = await User.findById(userId);
    if (!u) return fail(res, 404, 'Utilizator inexistent.');
    const level = levelOf(u.xp), owned = new Set(u.ownedItems || []);

    let total = 0; const toAdd = [];
    for (const id of ids) {
      const it = catalog.items[id];
      if (!it) return fail(res, 400, `Item invalid: ${id}`);
      if (it.lvl && level < it.lvl) return fail(res, 403, `Item blocat până la nivelul ${it.lvl}.`);
      if (it.price === 0 || owned.has(id)) continue;
      total += it.price; toAdd.push(id);
    }
    if (!toAdd.length) return res.json({ coins: u.coins, owned: [...owned] });

    const upd = await User.findOneAndUpdate(
      { _id: userId, coins: { $gte: total } },
      { $inc: { coins: -total }, $addToSet: { ownedItems: {$each: toAdd } } },
      { new: true }
    );
    if (!upd) return fail(res, 400, 'Nu ai destule monede.');
    res.json({ coins: upd.coins, owned: upd.ownedItems });
  } catch (e) { serverError(res, e); }
};

// POST /api/gamification/daily
exports.daily = async (req, res) => {
  try {
    const userId = uid(req);
    if (!userId) return fail(res, 401, 'Utilizator neautentificat.');
    await ensureInit(userId);

    const u = await User.findById(userId);
    if (!u) return fail(res, 404, 'Utilizator inexistent.');

    const today = getTodayStr();
    if (u.lastDailyClaim === today) {
      return fail(res, 400, 'Ai luat deja bonusul de azi. Revino mâine!');
    }

    const yesterday = getYesterdayStr();
    const streak = u.lastDailyClaim === yesterday ? (u.streak || 0) + 1 : 1;
    const reward = streak % 7 === 0 ? 200 : 50 + Math.min(streak, 6) * 10;

    u.lastDailyClaim = today;
    u.streak = streak;
    u.coins = (u.coins || 0) + reward;
    u.xp = (u.xp || 0) + DAILY_XP;
    await u.save();

    res.json({ reward, xpReward: DAILY_XP, ...serialize(u) });
  } catch (e) { serverError(res, e); }
};

// POST /api/gamification/battle-demo
exports.battleDemo = async (req, res) => {
  try {
    const userId = uid(req);
    if (!userId) return fail(res, 401, 'Utilizator neautentificat.');
    if (process.env.ENABLE_BATTLE_DEMO !== '1') return fail(res, 403, 'Bătălia demo e dezactivată.');
    await ensureInit(userId);
    const a = Math.floor(Math.random() * 6) + 4, b = Math.floor(Math.random() * 7) + 3;
    const won = a > b;
    const upd = await User.findOneAndUpdate(
      { _id: userId },
      { $inc: { xp: won ? 40 : 10, coins: won ? 90 : 20 } },
      { new: true }
    );
    res.json({ won, a, b, ...serialize(upd) });
  } catch (e) { serverError(res, e); }
};