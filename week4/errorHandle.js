const err500 = (res) =>{
    const headers = {
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Content-Length, X-Requested-With",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "PATCH, POST, GET,OPTIONS,DELETE",
        "Content-Type": "application/json"
    }
    res.writeHead(500, headers)
    res.write(JSON.stringify({
      status: "error",
      message: "伺服器錯誤"
    }))
    res.end()
}

const idErr400 = (res) =>{
  const headers = {
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Content-Length, X-Requested-With",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "PATCH, POST, GET,OPTIONS,DELETE",
      "Content-Type": "application/json"
  }
  res.writeHead(400, headers)
  res.write(JSON.stringify({
    status: "failed",
    message: "ID錯誤"
  }))
  res.end()
  return
}




module.exports = { err500, idErr400 };