export type SchemaFormat = Array<{ name: string, type: string }>;

export interface ICollectionRow {
    collection_name: string;
    author: string;
    allow_notify: boolean;
    authorized_accounts: string[];
    notify_accounts: string[];
    market_fee: number;
    serialized_data: Uint8Array;
}

export interface ISchemaRow {
    schema_name: string;
    format: SchemaFormat;
}

export interface ITemplateRow {
    template_id: number;
    collection_name: string;
    schema_name: string;
    transferable: boolean;
    burnable: boolean;
    max_supply: number;
    issued_supply: number;
    immutable_serialized_data: Uint8Array;
}

export interface IAssetRow {
    asset_id: string;
    collection_name: string;
    schema_name: string;
    template_id: string;
    ram_payer: string;
    backed_tokens: string[];
    immutable_serialized_data: Uint8Array;
    mutable_serialized_data: Uint8Array;
}

export interface IOfferRow {
    offer_id: string;
    sender: string;
    recipient: string;
    sender_asset_ids: string[];
    recipient_asset_ids: string[];
    memo: string;
}

export interface IConfigRow {
    asset_counter: string;
    offer_counter: string;
    collection_format: SchemaFormat;
}

export default class RpcCache {
    private readonly assets: { [id: string]: { data: IAssetRow, expiration: number, updated: number } } = {};
    private readonly templates: { [id: string]: { data: ITemplateRow, expiration: number, updated: number } } = {};
    private readonly schemas: { [id: string]: { data: ISchemaRow, expiration: number, updated: number } } = {};
    private readonly collections: { [id: string]: { data: ICollectionRow, expiration: number, updated: number } } = {};
    private readonly offers: { [id: string]: { data: IOfferRow, expiration: number, updated: number } } = {};

    private static access<T>(
        identifier: string | number,
        cache: { [id: string]: { expiration: number, updated: number, data: T } },
        data?: T | null | false
    ): T | undefined {
        if (data === null) {
            delete cache[String(identifier)];

            return;
        }

        if (data) {
            cache[String(identifier)] = {expiration: Date.now() + 15 * 60 * 1000, updated: Date.now(), data};

            return data;
        }

        if (typeof cache[String(identifier)] === 'undefined' || cache[String(identifier)].expiration < Date.now()) {
            return;
        }

        // if data is false then only return cache if it is not older than 5 seconds
        if (data === false && Date.now() - cache[String(identifier)].updated > 5 * 1000) {
            return;
        }

        return cache[String(identifier)].data;
    }

    asset(assetID: string, data?: any | null | false): IAssetRow | undefined {
        if (data) {
            data.mutable_serialized_data = new Uint8Array(data.mutable_serialized_data);
            data.immutable_serialized_data = new Uint8Array(data.immutable_serialized_data);
        }

        return RpcCache.access<IAssetRow>(assetID, this.assets, data);
    }

    template(templateID: string, data?: any | null | false): ITemplateRow | undefined {
        if (data) {
            data.immutable_serialized_data = new Uint8Array(data.immutable_serialized_data);
        }

        return RpcCache.access<ITemplateRow>(templateID, this.templates, data);
    }

    schema(schema: string, data?: any | null | false): ISchemaRow | undefined {
        return RpcCache.access<ISchemaRow>(schema, this.schemas, data);
    }

    collection(collection: string, data?: any | null | false): ICollectionRow | undefined {
        return RpcCache.access<ICollectionRow>(collection, this.collections, data);
    }

    offer(offerID: string, data?: any | null | false): IOfferRow | undefined {
        return RpcCache.access<IOfferRow>(offerID, this.offers, data);
    }
}
