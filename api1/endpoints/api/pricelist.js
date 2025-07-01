const { readFile } = require("fs/promises")
const path = require("path")


module.exports = {
    get :async (req, res) =>{
    try{
    const json_obj = JSON.parse((await readFile(path.join(__dirname, 'pricelist.json'))))
    return res.json(json_obj)
    } catch(nats) {
        console.log(nats)
    return res.status(500).json({message: 'Upps, an internal error occured, this error probably caused by json malformed syntax.'})
    }
    }
}