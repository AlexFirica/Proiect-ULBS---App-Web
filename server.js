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

app.post("/post-sign-up", async(req,res)=>{
    try{
        const new_sign_up=req.body;
        const hash= await argon2.hash(new_sign_up.password);
        insertuser(new_sign_up.Name, new_sign_up.email, new_sign_up.rol, hash);


    }catch(error){
        console.log(`Eroare ${error}`);
    }
})
async function insertuser(name,email,role,password){
    const text = 'INSERT INTO users(username, email, role ,password) VALUES($1, $2, $3, $4) RETURNING *';
    const values = [name, email, role, password ];

    try{
        const res = await pool.query(text,values);
        console.log('Data inserted successfully:', res.rows[0]); 

        
    }catch (error){
        console.error('Error executing query:', err.stack);
    }finally{
        await pool.end();
    }
    
}
app.listen(Port, () => {
    console.log(`Serverul rulează pe portul ${Port}`);
});