import "@nomiclabs/hardhat-ethers";
import 'dotenv/config';
import { generateSaveTree } from "../utils/utils";
import { existsSync, readFileSync } from "fs";
import MerkleTree from "merkletreejs";
import keccak256 from "keccak256";
import { BigNumber, Signer } from "ethers";
import { exit } from "process";

export async function deploy(
    hre: any, 
    leavesFile: string, 
    claimAmount: BigNumber) {

    let [signer] = await hre.ethers.getSigners();

    if (!existsSync(leavesFile)) {
        console.error(`${leavesFile} does not exst.`);
        exit(-1);
    }

    let addresses = readFileSync(leavesFile).toString().split(",");

    generateSaveTree(addresses, addresses.length, leavesFile);
    await deployCollector(hre, addresses, signer, claimAmount);
}

export async function deployCollector(
    hre: any, 
    leaves: string[] = [], 
    signer: Signer, 
    claimAmount: BigNumber) {

    let merkleTree = new MerkleTree(leaves, keccak256, { hashLeaves: true, sortPairs: true });
    let root = merkleTree.getHexRoot();

    let factory = await (await hre.ethers.getContractFactory("Collector")).connect(signer);
    let deploy = await factory.deploy(root, claimAmount);
    await deploy.deployTransaction.wait();
    console.log(`Deploy address: ${deploy.address}`);
}