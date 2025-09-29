import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const CONTRACT_NAME = "NebulaVoteHub";
const rel = "../nebula-hardhat";
const outdir = path.resolve("./abi");
if (!fs.existsSync(outdir)) fs.mkdirSync(outdir);

const dir = path.resolve(rel);
const deploymentsDir = path.join(dir, "deployments");

function readDeployment(chainName, chainId, contractName, optional = false) {
  const p = path.join(deploymentsDir, chainName, `${contractName}.json`);
  if (!fs.existsSync(p)) {
    if (!optional) {
      console.error(`Missing ${p}. Please run 'npx hardhat deploy --network ${chainName}' in ${rel}`);
      process.exit(1);
    }
    return undefined;
  }
  const obj = JSON.parse(fs.readFileSync(p, "utf-8"));
  obj.chainId = chainId; return obj;
}

let sepolia = readDeployment("sepolia", 11155111, CONTRACT_NAME, true);
let localhost = readDeployment("localhost", 31337, CONTRACT_NAME, true);
if (!localhost && sepolia) localhost = { abi: sepolia.abi, address: "0x0000000000000000000000000000000000000000" };
if (!sepolia && localhost) sepolia = { abi: localhost.abi, address: "0x0000000000000000000000000000000000000000" };

if (!sepolia && !localhost) {
  console.error("No deployments found for NebulaVoteHub.");
  process.exit(1);
}

const abiSrc = sepolia?.abi || localhost.abi;
const tsCode = `export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi: abiSrc }, null, 2)} as const;`;
const tsAddr = `export const ${CONTRACT_NAME}Addresses = { "31337": { address: "${localhost?.address || "0x0000000000000000000000000000000000000000"}" }, "11155111": { address: "${sepolia?.address || "0x0000000000000000000000000000000000000000"}" } } as const;`;

fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}Addresses.ts`), tsAddr, "utf-8");
console.log("ABI and addresses generated.");




