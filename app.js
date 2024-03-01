const express = require('express')
const app = express()
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const path = require('path')
const dbpath = path.join(__dirname, 'userData.db')
let db = null
//INTAILIZATION OF DB AND SERVER
const intailizationofDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is Starting at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB ERROR ${e.message}`)
    process.exit(1)
  }
}
intailizationofDBAndServer()
module.exports = app
app.use(express.json())
//API1
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const selectUserQuery = `
    SELECT *
    FROM user
    WHERE username = '${username}';
    `
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    //2 scenarios
    if (password.length > 5) {
      const hashedPassword = await bcrypt.hash(password, 10)
      const createUserQuery = `
                    INSERT INTO 
                        user (username, name, password, gender, location) 
                    VALUES 
                    (
                        '${username}', 
                        '${name}',
                        '${hashedPassword}', 
                        '${gender}',
                        '${location}'
                    )`
      await db.run(createUserQuery)
      response.status(200)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})
//LOGIN USER
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `
    SELECT *
    FROM user
    WHERE username = '${username}';`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})
//change password
app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const checkForUser = `
    SELECT *
    FROM user
    WHERE username = '${username}';
    `
  const dbUser = await db.get(checkForUser)
  if (dbUser === undefined) {
    response.status(400)
    response.send('User not registered')
  } else {
    const isValid = await bcrypt.compare(oldPassword, dbUser.password)
    if (isValid === true) {
      const lengthofPassword = newPassword.length
      if (lengthofPassword < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const encryptPassword = await bcrypt.hash(newPassword, 10)
        const updatePassword = `
                UPDATE user
                SET password ='${encryptPassword}'
                WHERE username = '${username}';
                `
        await db.run(updatePassword)
        response.status(200)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})
