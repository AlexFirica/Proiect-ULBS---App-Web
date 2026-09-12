const express=require("express");
const app=express();
const cors=require("cors");
const Port=3000;
const argon2 = require("argon2");
const pg = require("pg");
const pool = new pg.Pool({
  user: "postgres",
  host: "localhost",
  database: "users_edu",
  password: "costea12349",
  port: 5432,
});
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.post("/post-sign-up", async(req,res)=>{
    try{
        const new_sign_up=req.body;
        const hash= await argon2.hash(new_sign_up.password);
        const user = await insertuser(new_sign_up.Name, new_sign_up.email, new_sign_up.rol, hash);
        return res.status(201).json({ success: true, user: user });

   } catch (error) {
    console.log(`Eroare ${error}`);
    return res.status(500).json({ success: false, message: 'Eroare la înregistrare' });
  }
})
async function insertuser(name, email, role, password) {
  const text = 'INSERT INTO users(username, email, role, password) VALUES($1, $2, $3, $4) RETURNING *';
  const values = [name, email, role, password];

  try {
    const res = await pool.query(text, values);
    console.log('Data inserted successfully:', res.rows[0]);
    return res.rows[0];
  } catch (error) {
    console.error('Error executing query:', error.stack);
    throw error;
  }

}
//function for verifying a login
app.post('/login', async (req, res)=>{
    try{
        const loginattempt = req.body;
        const result = await checkuser(loginattempt.email, loginattempt.password);
    
    if (!result.success) {
        console.log('Invalid');
      return res.status(401).json({ success: false, message: result.message });
      
    }
    else console.log('Succes');

    return res.status(200).json({ success: true, user: result.user });
    }catch (error) {
    console.log(`Eroare ${error}`);
    return res.status(500).json({ success: false, message: 'Eroare de server' });
  }
})
async function checkuser(email,password){
    const text='SELECT * from users WHERE email =$1 ';
    const values=[email];
    try{
        const res= await pool.query(text,values);
        if(res.rows.length===0 ){
            return { success: false, message: 'Utilizatorul nu există' };
        }
        const user = res.rows[0];
        const validPassword=await argon2.verify(user.password,password);
        if (!validPassword) {
      return { success: false, message: 'Parolă incorectă' };
    }

    // Return user data (omit the password hash before returning)
    delete user.password;
    return { success: true, user: user };

  } catch (error) {
    console.error('Error executing query:', error.stack);
    throw error;
  }
    }

app.listen(Port, () => {
    console.log(`Serverul rulează pe portul ${Port}`);
});