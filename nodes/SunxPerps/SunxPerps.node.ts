import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { sunxApiRequest, sunxPublicApiRequest } from './SunxPerpsUtils';

export class SunxPerps implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SunX Perps',
		name: 'sunxPerps',
		icon: 'file:sunx.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with SunX Perpetual Futures API',
		defaults: {
			name: 'SunX Perps',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'sunxPerpsApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.baseUrl}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Account',
						value: 'account',
					},
					{
						name: 'Market Data',
						value: 'marketData',
					},
					{
						name: 'Order',
						value: 'order',
					},
					{
						name: 'Position',
						value: 'position',
					},
				],
				default: 'account',
			},

			// Account Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['account'],
					},
				},
				options: [
					{
						name: 'Get Balance',
						value: 'getBalance',
						description: 'Get account balance',
						action: 'Get account balance',
					},
					{
						name: 'Get Trading Bills',
						value: 'getTradingBills',
						description: 'Get trading bills',
						action: 'Get trading bills',
					},
				],
				default: 'getBalance',
			},

			// Market Data Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['marketData'],
					},
				},
				options: [
					{
						name: 'Get Contract Info',
						value: 'getContractInfo',
						description: 'Get contract information',
						action: 'Get contract information',
					},
					{
						name: 'Get Fee Info',
						value: 'getFeeInfo',
						description: 'Get fee information about pair',
						action: 'Get fee information',
					},
					{
						name: 'Get Funding Rate',
						value: 'getFundingRate',
						description: 'Get current funding rate',
						action: 'Get funding rate',
					},
					{
						name: 'Get Historical Funding Rate',
						value: 'getHistoricalFundingRate',
						description: 'Get historical funding rate',
						action: 'Get historical funding rate',
					},
					{
						name: 'Get Leverage Info',
						value: 'getLeverageInfo',
						description: 'Get futures risk limit',
						action: 'Get leverage information',
					},
					{
						name: 'Get Multi-Asset Collateral',
						value: 'getMultiAssetCollateral',
						description: 'Get assets available for multi-assets collateral mode',
						action: 'Get multi-asset collateral info',
					},
					{
						name: 'Get Swap Index Price',
						value: 'getSwapIndexPrice',
						description: 'Get swap index price information',
						action: 'Get swap index price',
					},
				],
				default: 'getFundingRate',
			},

			// Order Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['order'],
					},
				},
				options: [
					{
						name: 'Cancel All Orders',
						value: 'cancelAllOrders',
						description: 'Cancel all orders',
						action: 'Cancel all orders',
					},
					{
						name: 'Cancel Multiple Orders',
						value: 'cancelMultipleOrders',
						description: 'Cancel multiple orders',
						action: 'Cancel multiple orders',
					},
					{
						name: 'Cancel Order',
						value: 'cancelOrder',
						description: 'Cancel a single order',
						action: 'Cancel order',
					},
					{
						name: 'Close All at Market Price',
						value: 'closeAllAtMarket',
						description: 'Close all positions at market price',
						action: 'Close all at market price',
					},
					{
						name: 'Close Symbol at Market Price',
						value: 'closeSymbolAtMarket',
						description: 'Close all of a symbol at market price',
						action: 'Close symbol at market price',
					},
					{
						name: 'Get Current Orders',
						value: 'getCurrentOrders',
						description: 'Get current orders',
						action: 'Get current orders',
					},
					{
						name: 'Get Order History',
						value: 'getOrderHistory',
						description: 'Get order history',
						action: 'Get order history',
					},
					{
						name: 'Get Order Info',
						value: 'getOrderInfo',
						description: 'Get order information',
						action: 'Get order info',
					},
					{
						name: 'Place Multiple Orders',
						value: 'placeMultipleOrders',
						description: 'Place multiple orders',
						action: 'Place multiple orders',
					},
					{
						name: 'Place Order',
						value: 'placeOrder',
						description: 'Place a single order',
						action: 'Place order',
					},
				],
				default: 'placeOrder',
			},

			// Position Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['position'],
					},
				},
				options: [
					{
						name: 'Get Current Position',
						value: 'getCurrentPosition',
						description: 'Get current position',
						action: 'Get current position',
					},
					{
						name: 'Get Position Mode',
						value: 'getPositionMode',
						description: 'Get position mode',
						action: 'Get position mode',
					},
					{
						name: 'Set Leverage',
						value: 'setLeverage',
						description: 'Set leverage',
						action: 'Set leverage',
					},
					{
						name: 'Set Position Mode',
						value: 'setPositionMode',
						description: 'Set position mode',
						action: 'Set position mode',
					},
				],
				default: 'getCurrentPosition',
			},

			// Market Data Fields
			{
				displayName: 'Contract Code',
				name: 'contractCode',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['marketData'],
						operation: [
							'getFundingRate',
							'getHistoricalFundingRate',
							'getSwapIndexPrice',
							'getLeverageInfo',
							'getFeeInfo',
						],
					},
				},
				default: 'BTC-USDT',
				description: 'The contract code (e.g., BTC-USDT)',
			},

			// Order Fields - Place Order
			{
				displayName: 'Contract Code',
				name: 'contractCode',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['placeOrder'],
					},
				},
				default: 'BTC-USDT',
				description: 'The contract code (e.g., BTC-USDT)',
			},
			{
				displayName: 'Direction',
				name: 'direction',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['placeOrder'],
					},
				},
				options: [
					{
						name: 'Buy',
						value: 'buy',
					},
					{
						name: 'Sell',
						value: 'sell',
					},
				],
				default: 'buy',
				description: 'Order direction',
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['placeOrder'],
					},
				},
				options: [
					{
						name: 'Open',
						value: 'open',
					},
					{
						name: 'Close',
						value: 'close',
					},
				],
				default: 'open',
				description: 'Open or close position',
			},
			{
				displayName: 'Order Price Type',
				name: 'orderPriceType',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['placeOrder'],
					},
				},
				options: [
					{
						name: 'Limit',
						value: 'limit',
					},
					{
						name: 'Market',
						value: 'market',
					},
					{
						name: 'Post Only',
						value: 'post_only',
					},
					{
						name: 'FOK',
						value: 'fok',
					},
					{
						name: 'IOC',
						value: 'ioc',
					},
				],
				default: 'limit',
				description: 'Order price type',
			},
			{
				displayName: 'Volume',
				name: 'volume',
				type: 'number',
				required: true,
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['placeOrder'],
					},
				},
				default: 1,
				description: 'Order volume (number of contracts)',
			},
			{
				displayName: 'Price',
				name: 'price',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['placeOrder'],
						orderPriceType: ['limit', 'post_only'],
					},
				},
				default: 0,
				description: 'Order price (required for limit orders)',
			},
			{
				displayName: 'Leverage Rate',
				name: 'leverageRate',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['placeOrder'],
					},
				},
				default: 10,
				description: 'Leverage rate (e.g., 10 for 10x)',
			},
			{
				displayName: 'Client Order ID',
				name: 'clientOrderId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['placeOrder'],
					},
				},
				default: '',
				description: 'Client order ID (optional)',
			},

			// Order Fields - Place Multiple Orders
			{
				displayName: 'Orders',
				name: 'orders',
				type: 'json',
				required: true,
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['placeMultipleOrders'],
					},
				},
				default: '[]',
				description: 'Array of orders in JSON format',
				placeholder: '[{"contract_code":"BTC-USDT","direction":"buy","offset":"open","order_price_type":"limit","volume":1,"price":50000}]',
			},

			// Order Fields - Cancel Order
			{
				displayName: 'Order ID',
				name: 'orderId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['cancelOrder', 'getOrderInfo'],
					},
				},
				default: '',
				description: 'Order ID to cancel or get info',
			},
			{
				displayName: 'Contract Code',
				name: 'contractCode',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['cancelOrder', 'getOrderInfo'],
					},
				},
				default: '',
				description: 'Contract code (optional)',
			},

			// Order Fields - Cancel Multiple Orders
			{
				displayName: 'Order IDs',
				name: 'orderIds',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['cancelMultipleOrders'],
					},
				},
				default: '',
				description: 'Comma-separated list of order IDs',
			},

			// Order Fields - Cancel All / Close All
			{
				displayName: 'Contract Code',
				name: 'contractCode',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['cancelAllOrders', 'closeSymbolAtMarket'],
					},
				},
				default: '',
				description: 'Contract code (optional for cancel all, required for close symbol)',
			},
			{
				displayName: 'Direction',
				name: 'direction',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['closeSymbolAtMarket', 'closeAllAtMarket'],
					},
				},
				options: [
					{
						name: 'Buy',
						value: 'buy',
					},
					{
						name: 'Sell',
						value: 'sell',
					},
				],
				default: 'buy',
				description: 'Direction to close',
			},

			// Order Fields - Get Current Orders / Order History
			{
				displayName: 'Contract Code',
				name: 'contractCode',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['getCurrentOrders', 'getOrderHistory'],
					},
				},
				default: '',
				description: 'Contract code (optional)',
			},
			{
				displayName: 'Page Index',
				name: 'pageIndex',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['getOrderHistory'],
					},
				},
				default: 1,
				description: 'Page index',
			},
			{
				displayName: 'Page Size',
				name: 'pageSize',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['getOrderHistory'],
					},
				},
				default: 20,
				description: 'Page size',
			},

			// Position Fields
			{
				displayName: 'Contract Code',
				name: 'contractCode',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['position'],
						operation: ['getCurrentPosition', 'setLeverage'],
					},
				},
				default: '',
				description: 'Contract code (optional for get position, required for set leverage)',
			},
			{
				displayName: 'Leverage Rate',
				name: 'leverageRate',
				type: 'number',
				required: true,
				displayOptions: {
					show: {
						resource: ['position'],
						operation: ['setLeverage'],
					},
				},
				default: 10,
				description: 'Leverage rate to set',
			},
			{
				displayName: 'Position Mode',
				name: 'positionMode',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						resource: ['position'],
						operation: ['setPositionMode'],
					},
				},
				options: [
					{
						name: 'Dual Side',
						value: 'dual_side',
					},
					{
						name: 'Single Side',
						value: 'single_side',
					},
				],
				default: 'single_side',
				description: 'Position mode to set',
			},

			// Trading Bills Fields
			{
				displayName: 'Contract Code',
				name: 'contractCode',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['account'],
						operation: ['getTradingBills'],
					},
				},
				default: '',
				description: 'Contract code (optional)',
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['account'],
						operation: ['getTradingBills'],
					},
				},
				options: [
					{
						name: 'All',
						value: '',
					},
					{
						name: 'Open Long',
						value: 'open_long',
					},
					{
						name: 'Open Short',
						value: 'open_short',
					},
					{
						name: 'Close Long',
						value: 'close_long',
					},
					{
						name: 'Close Short',
						value: 'close_short',
					},
				],
				default: '',
				description: 'Bill type',
			},
		],
	};
}

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
