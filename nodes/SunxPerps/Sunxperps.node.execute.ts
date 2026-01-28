import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { sunxApiRequest, sunxPublicApiRequest } from './SunxPerpsUtils';

export class SunxPerps implements INodeType {
	description: INodeTypeDescription;

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData;

				// ACCOUNT OPERATIONS
				if (resource === 'account') {
					if (operation === 'getBalance') {
						responseData = await sunxApiRequest.call(
							this,
							'GET',
							'/sapi/v1/account/balance',
						);
					} else if (operation === 'getTradingBills') {
						const qs: any = {};
						const contractCode = this.getNodeParameter('contractCode', i, '') as string;
						const type = this.getNodeParameter('type', i, '') as string;

						if (contractCode) qs.contract_code = contractCode;
						if (type) qs.type = type;

						responseData = await sunxApiRequest.call(
							this,
							'GET',
							'/sapi/v1/account/financial_record',
							undefined,
							qs,
						);
					}
				}

				// MARKET DATA OPERATIONS
				else if (resource === 'marketData') {
					if (operation === 'getContractInfo') {
						responseData = await sunxPublicApiRequest.call(
							this,
							'GET',
							'/sapi/v1/public/contract_info',
						);
					} else if (operation === 'getFeeInfo') {
						const contractCode = this.getNodeParameter('contractCode', i) as string;
						responseData = await sunxPublicApiRequest.call(
							this,
							'GET',
							'/sapi/v1/public/swap_fee',
							{ contract_code: contractCode },
						);
					} else if (operation === 'getFundingRate') {
						const contractCode = this.getNodeParameter('contractCode', i) as string;
						responseData = await sunxPublicApiRequest.call(
							this,
							'GET',
							'/sapi/v1/public/funding_rate',
							{ contract_code: contractCode },
						);
					} else if (operation === 'getHistoricalFundingRate') {
						const contractCode = this.getNodeParameter('contractCode', i) as string;
						responseData = await sunxPublicApiRequest.call(
							this,
							'GET',
							'/sapi/v1/public/historical_funding_rate',
							{ contract_code: contractCode },
						);
					} else if (operation === 'getLeverageInfo') {
						const contractCode = this.getNodeParameter('contractCode', i) as string;
						responseData = await sunxPublicApiRequest.call(
							this,
							'GET',
							'/sapi/v1/public/swap_adjustfactor',
							{ contract_code: contractCode },
						);
					} else if (operation === 'getMultiAssetCollateral') {
						responseData = await sunxPublicApiRequest.call(
							this,
							'GET',
							'/sapi/v1/public/cross_transfer_info',
						);
					} else if (operation === 'getSwapIndexPrice') {
						const contractCode = this.getNodeParameter('contractCode', i) as string;
						responseData = await sunxPublicApiRequest.call(
							this,
							'GET',
							'/sapi/v1/public/swap_index',
							{ contract_code: contractCode },
						);
					}
				}

				// ORDER OPERATIONS
				else if (resource === 'order') {
					if (operation === 'placeOrder') {
						const contractCode = this.getNodeParameter('contractCode', i) as string;
						const direction = this.getNodeParameter('direction', i) as string;
						const offset = this.getNodeParameter('offset', i) as string;
						const orderPriceType = this.getNodeParameter('orderPriceType', i) as string;
						const volume = this.getNodeParameter('volume', i) as number;
						const price = this.getNodeParameter('price', i, 0) as number;
						const leverageRate = this.getNodeParameter('leverageRate', i, 10) as number;
						const clientOrderId = this.getNodeParameter('clientOrderId', i, '') as string;

						const body: any = {
							contract_code: contractCode,
							direction,
							offset,
							order_price_type: orderPriceType,
							volume,
							lever_rate: leverageRate,
						};

						if (price && (orderPriceType === 'limit' || orderPriceType === 'post_only')) {
							body.price = price;
						}

						if (clientOrderId) {
							body.client_order_id = clientOrderId;
						}

						responseData = await sunxApiRequest.call(
							this,
							'POST',
							'/sapi/v1/order',
							body,
						);
					} else if (operation === 'placeMultipleOrders') {
						const ordersJson = this.getNodeParameter('orders', i) as string;
						let orders;

						try {
							orders = JSON.parse(ordersJson);
						} catch (error) {
							throw new NodeOperationError(
								this.getNode(),
								'Invalid JSON format for orders',
								{ itemIndex: i },
							);
						}

						responseData = await sunxApiRequest.call(
							this,
							'POST',
							'/sapi/v1/order/batch',
							{ orders_data: orders },
						);
					} else if (operation === 'cancelOrder') {
						const orderId = this.getNodeParameter('orderId', i) as string;
						const contractCode = this.getNodeParameter('contractCode', i, '') as string;

						const body: any = {
							order_id: orderId,
						};

						if (contractCode) {
							body.contract_code = contractCode;
						}

						responseData = await sunxApiRequest.call(
							this,
							'POST',
							'/sapi/v1/order/cancel',
							body,
						);
					} else if (operation === 'cancelMultipleOrders') {
						const orderIdsString = this.getNodeParameter('orderIds', i) as string;
						const orderIds = orderIdsString.split(',').map((id) => id.trim());

						responseData = await sunxApiRequest.call(
							this,
							'POST',
							'/sapi/v1/order/cancel',
							{ order_id: orderIds.join(',') },
						);
					} else if (operation === 'cancelAllOrders') {
						const contractCode = this.getNodeParameter('contractCode', i, '') as string;

						const body: any = {};
						if (contractCode) {
							body.contract_code = contractCode;
						}

						responseData = await sunxApiRequest.call(
							this,
							'POST',
							'/sapi/v1/order/cancelall',
							body,
						);
					} else if (operation === 'closeSymbolAtMarket') {
						const contractCode = this.getNodeParameter('contractCode', i) as string;
						const direction = this.getNodeParameter('direction', i, 'buy') as string;

						responseData = await sunxApiRequest.call(
							this,
							'POST',
							'/sapi/v1/order/close_position',
							{
								contract_code: contractCode,
								direction,
							},
						);
					} else if (operation === 'closeAllAtMarket') {
						const direction = this.getNodeParameter('direction', i, 'buy') as string;

						responseData = await sunxApiRequest.call(
							this,
							'POST',
							'/sapi/v1/order/close_all_position',
							{ direction },
						);
					} else if (operation === 'getCurrentOrders') {
						const qs: any = {};
						const contractCode = this.getNodeParameter('contractCode', i, '') as string;

						if (contractCode) qs.contract_code = contractCode;

						responseData = await sunxApiRequest.call(
							this,
							'GET',
							'/sapi/v1/order/openorders',
							undefined,
							qs,
						);
					} else if (operation === 'getOrderHistory') {
						const qs: any = {};
						const contractCode = this.getNodeParameter('contractCode', i, '') as string;
						const pageIndex = this.getNodeParameter('pageIndex', i, 1) as number;
						const pageSize = this.getNodeParameter('pageSize', i, 20) as number;

						if (contractCode) qs.contract_code = contractCode;
						qs.page_index = pageIndex;
						qs.page_size = pageSize;

						responseData = await sunxApiRequest.call(
							this,
							'GET',
							'/sapi/v1/order/hisorders',
							undefined,
							qs,
						);
					} else if (operation === 'getOrderInfo') {
						const orderId = this.getNodeParameter('orderId', i) as string;
						const contractCode = this.getNodeParameter('contractCode', i, '') as string;

						const qs: any = {
							order_id: orderId,
						};

						if (contractCode) qs.contract_code = contractCode;

						responseData = await sunxApiRequest.call(
							this,
							'GET',
							'/sapi/v1/order/info',
							undefined,
							qs,
						);
					}
				}

				// POSITION OPERATIONS
				else if (resource === 'position') {
					if (operation === 'getCurrentPosition') {
						const qs: any = {};
						const contractCode = this.getNodeParameter('contractCode', i, '') as string;

						if (contractCode) qs.contract_code = contractCode;

						responseData = await sunxApiRequest.call(
							this,
							'GET',
							'/sapi/v1/position/info',
							undefined,
							qs,
						);
					} else if (operation === 'setLeverage') {
						const contractCode = this.getNodeParameter('contractCode', i) as string;
						const leverageRate = this.getNodeParameter('leverageRate', i) as number;

						responseData = await sunxApiRequest.call(
							this,
							'POST',
							'/sapi/v1/position/switch_lever_rate',
							{
								contract_code: contractCode,
								lever_rate: leverageRate,
							},
						);
					} else if (operation === 'getPositionMode') {
						responseData = await sunxApiRequest.call(
							this,
							'GET',
							'/sapi/v1/position/position_mode',
						);
					} else if (operation === 'setPositionMode') {
						const positionMode = this.getNodeParameter('positionMode', i) as string;

						responseData = await sunxApiRequest.call(
							this,
							'POST',
							'/sapi/v1/position/switch_position_mode',
							{
								position_mode: positionMode,
							},
						);
					}
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData as any),
					{ itemData: { item: i } },
				);

				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					const executionErrorData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: error.message }),
						{ itemData: { item: i } },
					);
					returnData.push(...executionErrorData);
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
