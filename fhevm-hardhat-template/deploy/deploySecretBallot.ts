import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployed = await deploy("SecretBallot", {
    from: deployer,
    args: [],
    log: true,
  });

  console.log(`SecretBallot contract deployed at: ${deployed.address}`);
};

export default func;
func.id = "deploy_secretballot";
func.tags = ["SecretBallot"];


