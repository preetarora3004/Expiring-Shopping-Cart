import express from "express"
import "dotenv/config"

const PORT = process.env.PORT
const app = express()

app.use(express.json())

try{
    app.listen(PORT, () => {
        console.log(`Server is listening on the ${PORT}`) 
    })
}
catch(err) {
    console.log(`Error: ${err}`)
    process.exit(1)
}
