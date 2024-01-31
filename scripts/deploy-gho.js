/* eslint-disable @typescript-eslint/no-var-requires */
const deploy = require('./deploy.js')

async function main() {
  await deploy.Deployer('Gho')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
