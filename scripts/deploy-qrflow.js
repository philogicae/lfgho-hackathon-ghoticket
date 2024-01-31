/* eslint-disable @typescript-eslint/no-var-requires */
const deploy = require('./deploy.js')
const prompt = require('prompt-sync')()
const childfork = require('child_process')

function exec(
  cmd,
  handler = function (error, stdout, stderr) {
    console.log(stdout)
    if (error !== null) console.log(stderr)
  }
) {
  return childfork.exec(cmd, handler)
}

async function main() {
  let gho = prompt('address gho: ')
  if (!gho) gho = await deploy.Deployer('Gho')
  const addr = await deploy.Deployer('QRFlow', [gho])
  console.log('Wait 10 seconds...')
  await new Promise((resolve) => setTimeout(resolve, 10000))
  exec(`pnpm run verify ${hre.network.name} ${addr} ${gho}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
