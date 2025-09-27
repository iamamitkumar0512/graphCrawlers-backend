import {
  Graph,
  Ipfs,
  getSmartAccountWalletClient,
} from "@graphprotocol/grc-20";

export class GraphProtocolService {
  constructor() {}

  // Helper method to get the wallet address from environment
  getWalletAddress(): string {
    const address = process.env.ADDRESS;
    if (!address) {
      throw new Error("ADDRESS environment variable is required");
    }
    return address;
  }

  // Helper method to get the private key from environment
  getPrivateKey(): string {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("PRIVATE_KEY environment variable is required");
    }
    return privateKey;
  }

  async createWallet() {
    const privateKey = this.getPrivateKey();
    const smartAccountWalletClient = await getSmartAccountWalletClient({
      privateKey: privateKey as `0x${string}`,
    });
    return smartAccountWalletClient;
  }

  async createSpace(
    editorAddress: string,
    spaceName: string,
    network: "TESTNET" | "MAINNET" = "TESTNET"
  ) {
    try {
      console.log("Creating space with params:", {
        editorAddress,
        name: spaceName,
        network,
      });

      const space = await Graph.createSpace({
        editorAddress,
        name: spaceName,
        network: "TESTNET",
        governanceType: "PUBLIC",
      });

      console.log("space", space);
      return space;
    } catch (error) {
      console.error("Error creating space:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  async createEntity(
    entityData: {
      name: string;
      description?: string;
      types?: string[];
      cover?: string;
      values?: Array<{ property: string; value: any }>;
    },
    author?: string,
    editName?: string,
    spaceId?: string,
    network: "TESTNET" | "MAINNET" = "TESTNET"
  ) {
    const id = this.generateId();
    const { ops, id: entityId } = await Graph.createEntity({
      id,
      ...entityData,
    });

    console.log("entity id", entityId);

    // Publish the operations if author is provided
    let publishResult = null;
    if (author) {
      try {
        if (spaceId) {
          // Complete publication flow: publish to IPFS, create edit, send transaction
          const result = await this.publishData(
            spaceId,
            ops,
            author,
            editName,
            network
          );
          publishResult = {
            cid: result.cid,
            transactionHash: result.transactionHash,
            toAddress: result.toAddress,
            calldata: result.calldata,
          };
          console.log(
            "Operations published to IPFS and blockchain:",
            publishResult
          );
        } else {
          // Just publish to IPFS without blockchain transaction
          const cid = await this.publishEdit(ops, author, editName);
          publishResult = { cid };
          console.log("Operations published to IPFS with CID:", cid);
        }
      } catch (error) {
        console.error("Error publishing operations:", error);
        throw error;
      }
    }

    return { ops, entityId, publishResult };
  }

  async createImage(imageData: { url: string }) {
    const { id: imageId, ops } = await Graph.createImage({
      url: imageData.url,
    });
    console.log("image id", imageId);
    return { id: imageId, ops, imageUrl: imageData.url };
  }

  async createType(typeData: {
    name: string;
    cover?: string;
    properties?: string[];
  }) {
    const { id: typeId, ops } = await Graph.createType(typeData);
    console.log("type id", typeId);
    return { id: typeId, ops: ops || [] };
  }

  async createProperty(propertyData: {
    name: string;
    dataType: "STRING" | "NUMBER" | "BOOLEAN" | "TIME" | "POINT" | "RELATION";
  }) {
    try {
      const { id: propertyId, ops } = await Graph.createProperty({
        name: propertyData.name,
        dataType: propertyData.dataType,
      });

      console.log("property id", propertyId);
      return { id: propertyId, ops };
    } catch (error) {
      console.error("Error creating property:", error);
      throw new Error("Property creation failed");
    }
  }

  async publishEdit(ops: any[], author: string, editName?: string) {
    const { cid } = await Ipfs.publishEdit({
      name: editName || "Edit name",
      ops,
      author: author as `0x${string}`,
    });

    console.log("cid", cid);
    return cid;
  }

  async createEdit(
    spaceId: string,
    cid: string,
    network: "TESTNET" | "MAINNET" = "TESTNET"
  ): Promise<{ to: string; data: string }> {
    const apiOrigin =
      network === "TESTNET"
        ? Graph.TESTNET_API_ORIGIN
        : Graph.MAINNET_API_ORIGIN;

    const result = await fetch(`${apiOrigin}/space/${spaceId}/edit/calldata`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cid }),
    });

    if (!result.ok) {
      throw new Error(`Failed to create edit: ${result.statusText}`);
    }

    const editResultJson = (await result.json()) as {
      to: string;
      data: string;
    };
    console.log("editResultJson", editResultJson);
    const { to, data } = editResultJson;

    console.log("to", to);
    console.log("data", data);
    return { to, data };
  }

  async sendTransaction(to: string, data: string) {
    const smartAccountWalletClient = await this.createWallet();

    const txResult = await smartAccountWalletClient.sendTransaction({
      to: to as `0x${string}`,
      value: 0n,
      data: data as `0x${string}`,
    });

    console.log("txResult", txResult);
    return txResult;
  }

  // New method: Complete transaction flow for publishing data
  async publishData(
    spaceId: string,
    ops: any[],
    author: string,
    editName?: string,
    network: "TESTNET" | "MAINNET" = "TESTNET"
  ) {
    try {
      // Publish to IPFS
      const cid = await this.publishEdit(ops, author, editName);

      // Get transaction calldata
      const { to, data } = await this.createEdit(spaceId, cid, network);

      // Send transaction
      const txResult = await this.sendTransaction(to, data);

      return {
        cid,
        transactionHash: txResult,
        toAddress: to,
        calldata: data,
      };
    } catch (error) {
      console.error("Error publishing data:", error);
      throw error;
    }
  }

  async executeFullFlow() {
    try {
      // Initialize wallet
      const address = this.getWalletAddress();

      // Create space
      const space = await this.createSpace(address, "test", "TESTNET");
      const spaceId = space.id;

      // Create entity
      const { ops, entityId: id } = await this.createEntity({
        name: "test name",
        description: "test description",
      });
      console.log("entity id", id);

      // Publish edit
      const cid = await this.publishEdit(ops, address);
      console.log("cid", cid);

      // Create edit calldata
      const { to, data } = await this.createEdit(spaceId, cid);

      // Send transaction
      const txResult = await this.sendTransaction(to, data);

      return {
        space,
        entityId: id,
        cid,
        txResult,
      };
    } catch (error) {
      console.error("Error in Graph Protocol flow:", error);
      throw error;
    }
  }

  // Generate a new unique ID
  generateId() {
    // The Id.generate() functionality should be implemented differently
    // For now, we'll generate a UUID-like identifier
    const newId = crypto.randomUUID();
    return newId;
  }

  // Utility function to serialize numbers for NUMBER properties
  serializeNumber(value: number): string {
    return value.toString();
  }

  // Create complete entity with properties, types, and values
  async createCompleteEntity(entityConfig: {
    name: string;
    description?: string;
    cover?: string;
    types?: string[];
    properties?: Array<{
      name: string;
      dataType: "STRING" | "NUMBER" | "BOOLEAN" | "TIME" | "POINT" | "RELATION";
    }>;
    values?: Array<{
      property: string;
      value: any;
    }>;
    spaceId: string;
    author: string;
    editName: string;
    network: "TESTNET" | "MAINNET";
  }) {
    const ops: any[] = [];
    const propertyIds: { [key: string]: string } = {};

    // Create properties if provided
    if (entityConfig.properties) {
      for (const prop of entityConfig.properties) {
        const { id: propertyId, ops: propertyOps } = await this.createProperty({
          name: prop.name,
          dataType: prop.dataType,
        });
        ops.push(...propertyOps);
        propertyIds[prop.name] = propertyId;
      }
    }

    // Create entity with values
    const entityData: any = {
      name: entityConfig.name,
      description: entityConfig.description,
      cover: entityConfig.cover,
      types: entityConfig.types || [],
    };

    // Add values if provided
    if (entityConfig.values) {
      entityData.values = entityConfig.values.map((val) => ({
        property: val.property,
        value: val.value,
      }));
    }

    const { id: entityId, ops: entityOps } = await Graph.createEntity(
      entityData
    );
    ops.push(...entityOps);

    const result = await this.publishData(
      entityConfig.spaceId,
      ops,
      entityConfig.author,
      entityConfig.editName,
      entityConfig.network
    );

    return {
      entityId,
      propertyIds,
      ops,
      result,
    };
  }
}

// Example usage function
export async function runGraphProtocolExample() {
  // Take the address and enter it in Faucet to get some testnet ETH https://faucet.conduit.xyz/geo-test-zc16z3tcvf
  const service = new GraphProtocolService();

  try {
    const result = await service.executeFullFlow();
    return result;
  } catch (error) {
    console.error("Error running Graph Protocol example:", error);
    throw error;
  }
}
