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
				displayName: 'Side',
				name: 'side',
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
				description: 'Order side',
			},
			{
				displayName: 'Type',
				name: 'type',
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
				],
				default: 'limit',
				description: 'Order type',
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
						type: ['limit', 'post_only'],
					},
				},
				default: 0,
				description: 'Order price (required for limit orders)',
			},
			{
				displayName: 'Margin Mode',
				name: 'marginMode',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['placeOrder'],
					},
				},
				options: [
					{
						name: 'Cross',
						value: 'cross',
					},
					{
						name: 'Isolated',
						value: 'isolated',
					},
				],
				default: 'cross',
				description: 'Margin mode',
			},
			{
				displayName: 'Position Side',
				name: 'positionSide',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['placeOrder'],
					},
				},
				options: [
					{
						name: 'Both (One-way)',
						value: 'both',
					},
					{
						name: 'Long',
						value: 'long',
					},
					{
						name: 'Short',
						value: 'short',
					},
				],
				default: 'both',
				description: 'Position side',
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
				placeholder: '[{"contract_code":"BTC-USDT","margin_mode":"cross","position_side":"both","side":"buy","type":"limit","volume":"1","price":"50000"}]',
			},

			// Order Fields - Cancel Order
			{
				displayName: 'Contract Code',
				name: 'contractCode',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['cancelOrder'],
					},
				},
				default: 'BTC-USDT',
				description: 'Contract code',
			},
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

			// Order Fields - Cancel Multiple Orders
			{
				displayName: 'Contract Code',
				name: 'contractCode',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['cancelMultipleOrders'],
					},
				},
				default: 'BTC-USDT',
				description: 'Contract code (required)',
			},
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

			// Order Fields - Cancel All Orders
			{
				displayName: 'Contract Code',
				name: 'contractCode',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['cancelAllOrders'],
					},
				},
				default: '',
				description: 'Contract code (optional - leave empty to cancel all)',
			},

			// Order Fields - Close Symbol
			{
				displayName: 'Contract Code',
				name: 'contractCode',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['closeSymbolAtMarket'],
					},
				},
				default: 'BTC-USDT',
				description: 'Contract code',
			},
			{
				displayName: 'Margin Mode',
				name: 'marginMode',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['closeSymbolAtMarket'],
					},
				},
				options: [
					{
						name: 'Cross',
						value: 'cross',
					},
					{
						name: 'Isolated',
						value: 'isolated',
					},
				],
				default: 'cross',
				description: 'Margin mode',
			},
			{
				displayName: 'Position Side',
				name: 'positionSide',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['closeSymbolAtMarket'],
					},
				},
				options: [
					{
						name: 'Both',
						value: 'both',
					},
					{
						name: 'Long',
						value: 'long',
					},
					{
						name: 'Short',
						value: 'short',
					},
				],
				default: 'both',
				description: 'Position side',
			},

			// Order Fields - Get Current Orders / Order History
			{
				displayName: 'Contract Code',
				name: 'contractCode',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['getCurrentOrders', 'getOrderHistory', 'getOrderInfo'],
					},
				},
				default: '',
				description: 'Contract code (optional for list, required for getOrderInfo)',
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
				displayName: 'Margin Mode',
				name: 'marginMode',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						resource: ['position'],
						operation: ['setLeverage'],
					},
				},
				options: [
					{
						name: 'Cross',
						value: 'cross',
					},
					{
						name: 'Isolated',
						value: 'isolated',
					},
				],
				default: 'cross',
				description: 'Margin mode',
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
						name: 'Dual Side (Hedge)',
						value: 'dual_side',
					},
					{
						name: 'Single Side (One-way)',
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
				displayName: 'Margin Account',
				name: 'marginAccount',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['account'],
						operation: ['getTradingBills'],
					},
				},
				default: 'USDT',
				description: 'Margin account (e.g., USDT, BTC-USDT)',
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
						const body: any = {};
						const contractCode = this.getNodeParameter('contractCode', i, '') as string;
						const marginAccount = this.getNodeParameter('marginAccount', i) as string;
						const type = this.getNodeParameter('type', i, '') as string;

						body.mar_acct = marginAccount;
						if (contractCode) body.contract = contractCode;
						if (type) body.type = type;

						responseData = await sunxApiRequest.call(
							this,
							'POST',
							'/sapi/v1/account/bill_record',
							body,
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
							'/sapi/v1/trade/swap_fee',
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
							'/sapi/v1/trade/historical_funding_rate',
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
							'/sapi/v1/trade/cross_transfer_info',
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

				// ORDER OPERATIONS - ALL USE /sapi/v1/trade/*
				else if (resource === 'order') {
					if (operation === 'placeOrder') {
						const contractCode = this.getNodeParameter('contractCode', i) as string;
						const side = this.getNodeParameter('side', i) as string;
						const type = this.getNodeParameter('type', i) as string;
						const volume = this.getNodeParameter('volume', i) as number;
						const price = this.getNodeParameter('price', i, 0) as number;
						const marginMode = this.getNodeParameter('marginMode', i, 'cross') as string;
						const positionSide = this.getNodeParameter('positionSide', i, 'both') as string;
						const clientOrderId = this.getNodeParameter('clientOrderId', i, '') as string;

						const body: any = {
							contract_code: contractCode,
							margin_mode: marginMode,
							position_side: positionSide,
							side: side,
							type: type,
							volume: String(volume),
						};

						if (price && (type === 'limit' || type === 'post_only')) {
							body.price = String(price);
						}

						if (clientOrderId) {
							body.client_order_id = clientOrderId;
						}

						responseData = await sunxApiRequest.call(
							this,
							'POST',
							'/sapi/v1/trade/order',
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
							'/sapi/v1/trade/batch_orders',
							orders,
						);
					} else if (operation === 'cancelOrder') {
						const orderId = this.getNodeParameter('orderId', i) as string;
						const contractCode = this.getNodeParameter('contractCode', i) as string;

						const body: any = {
							contract_code: contractCode,
							order_id: orderId,
						};

						responseData = await sunxApiRequest.call(
							this,
							'POST',
							'/sapi/v1/trade/cancel_order',
							body,
						);
					} else if (operation === 'cancelMultipleOrders') {
						const orderIdsString = this.getNodeParameter('orderIds', i) as string;
						const contractCode = this.getNodeParameter('contractCode', i) as string;
						const orderIds = orderIdsString.split(',').map((id) => id.trim());

						responseData = await sunxApiRequest.call(
							this,
							'POST',
							'/sapi/v1/trade/cancel_batch_orders',
							{
								contract_code: contractCode,
								order_id: orderIds,
							},
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
							'/sapi/v1/trade/cancel_all_orders',
							body,
						);
					} else if (operation === 'closeSymbolAtMarket') {
						const contractCode = this.getNodeParameter('contractCode', i) as string;
						const marginMode = this.getNodeParameter('marginMode', i, 'cross') as string;
						const positionSide = this.getNodeParameter('positionSide', i, 'both') as string;

						responseData = await sunxApiRequest.call(
							this,
							'POST',
							'/sapi/v1/trade/position',
							{
								contract_code: contractCode,
								margin_mode: marginMode,
								position_side: positionSide,
							},
						);
					} else if (operation === 'closeAllAtMarket') {
						responseData = await sunxApiRequest.call(
							this,
							'POST',
							'/sapi/v1/trade/position_all',
							{},
						);
					} else if (operation === 'getCurrentOrders') {
						const qs: any = {};
						const contractCode = this.getNodeParameter('contractCode', i, '') as string;

						if (contractCode) qs.contract_code = contractCode;

						responseData = await sunxApiRequest.call(
							this,
							'GET',
							'/sapi/v1/trade/order/opens',
							undefined,
							qs,
						);
					} else if (operation === 'getOrderHistory') {
						const qs: any = {};
						const contractCode = this.getNodeParameter('contractCode', i) as string;
						const marginMode = this.getNodeParameter('marginMode', i) as string;
						const pageIndex = this.getNodeParameter('pageIndex', i, 1) as number;
						const pageSize = this.getNodeParameter('pageSize', i, 20) as number;

						qs.contract_code = contractCode;
						qs.margin_mode = marginMode;
						qs.from = pageIndex;
						qs.limit = pageSize;

						responseData = await sunxApiRequest.call(
							this,
							'GET',
							'/sapi/v1/trade/order/history',
							undefined,
							qs,
						);
					} else if (operation === 'getOrderInfo') {
						const orderId = this.getNodeParameter('orderId', i) as string;
						const contractCode = this.getNodeParameter('contractCode', i) as string;

						const qs: any = {
							contract_code: contractCode,
							order_id: orderId,
						};

						responseData = await sunxApiRequest.call(
							this,
							'GET',
							'/sapi/v1/trade/order',
							undefined,
							qs,
						);
					}
				}

				// POSITION OPERATIONS
				// Get Current Position uses /sapi/v1/trade/position/opens
				// All other position operations use /sapi/v1/position/*
				else if (resource === 'position') {
					if (operation === 'getCurrentPosition') {
						const qs: any = {};
						const contractCode = this.getNodeParameter('contractCode', i, '') as string;

						if (contractCode) qs.contract_code = contractCode;

						responseData = await sunxApiRequest.call(
							this,
							'GET',
							'/sapi/v1/trade/position/opens',
							undefined,
							qs,
						);
					} else if (operation === 'setLeverage') {
						const contractCode = this.getNodeParameter('contractCode', i) as string;
						const leverageRate = this.getNodeParameter('leverageRate', i) as number;
						const marginMode = this.getNodeParameter('marginMode', i) as string;

						responseData = await sunxApiRequest.call(
							this,
							'POST',
							'/sapi/v1/position/lever',
							{
								contract_code: contractCode,
								lever_rate: leverageRate,
								margin_mode: marginMode,
							},
						);
					} else if (operation === 'getPositionMode') {
						responseData = await sunxApiRequest.call(
							this,
							'GET',
							'/sapi/v1/position/mode',
						);
					} else if (operation === 'setPositionMode') {
						const positionMode = this.getNodeParameter('positionMode', i) as string;

						responseData = await sunxApiRequest.call(
							this,
							'POST',
							'/sapi/v1/position/mode',
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
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					const executionErrorData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: errorMessage }),
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
