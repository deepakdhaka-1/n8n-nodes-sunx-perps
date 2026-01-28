import { IExecuteFunctions, IHttpRequestOptions, IHttpRequestMethods } from 'n8n-workflow';
import CryptoJS from 'crypto-js';

export interface SunxCredentials {
	accessKeyId: string;
	secretKey: string;
	baseUrl: string;
}

/**
 * Generate HMAC SHA256 signature for SunX API
 */
export function generateSignature(
	method: string,
	host: string,
	path: string,
	params: { [key: string]: any },
	secretKey: string,
): string {
	// Sort parameters alphabetically
	const sortedParams = Object.keys(params)
		.sort()
		.reduce((acc, key) => {
			acc[key] = params[key];
			return acc;
		}, {} as { [key: string]: any });

	// Build query string
	const queryString = Object.entries(sortedParams)
		.map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
		.join('&');

	// Build string to sign
	const stringToSign = `${method}\n${host}\n${path}\n${queryString}`;

	// Generate signature
	const signature = CryptoJS.HmacSHA256(stringToSign, secretKey);
	return CryptoJS.enc.Base64.stringify(signature);
}

/**
 * Build authenticated request options for SunX API
 */
export function buildAuthenticatedRequest(
	this: IExecuteFunctions,
	credentials: SunxCredentials,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: any,
	qs?: any,
): IHttpRequestOptions {
	const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, '');
	const url = new URL(credentials.baseUrl + endpoint);
	const host = url.hostname;
	const path = url.pathname;

	// Build parameters for signature
	const params: { [key: string]: any } = {
		AccessKeyId: credentials.accessKeyId,
		SignatureMethod: 'HmacSHA256',
		SignatureVersion: '2',
		Timestamp: timestamp,
		...qs,
	};

	// Generate signature
	const signature = generateSignature(method, host, path, params, credentials.secretKey);
	params.Signature = signature;

	const options: IHttpRequestOptions = {
		method,
		url: endpoint,
		qs: params,
		headers: {
			'Content-Type': 'application/json',
		},
		json: true,
	};

	if (body && (method === 'POST' || method === 'PUT')) {
		options.body = body;
	}

	return options;
}

/**
 * Helper to make authenticated API request
 */
export async function sunxApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: any,
	qs?: any,
): Promise<any> {
	const credentials = await this.getCredentials('sunxPerpsApi') as SunxCredentials;
	
	const options = buildAuthenticatedRequest.call(
		this,
		credentials,
		method,
		endpoint,
		body,
		qs,
	);

	try {
		return await this.helpers.httpRequest(options);
	} catch (error: any) {
		if (error.response?.body) {
			const errorBody = error.response.body;
			throw new Error(
				`SunX API Error: ${errorBody.err_msg || errorBody.message || JSON.stringify(errorBody)}`,
			);
		}
		throw error;
	}
}

/**
 * Helper for public API requests (no authentication needed)
 */
export async function sunxPublicApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	qs?: any,
): Promise<any> {
	const credentials = await this.getCredentials('sunxPerpsApi') as SunxCredentials;

	const options: IHttpRequestOptions = {
		method,
		baseURL: credentials.baseUrl,
		url: endpoint,
		qs,
		headers: {
			'Content-Type': 'application/json',
		},
		json: true,
	};

	try {
		return await this.helpers.httpRequest(options);
	} catch (error: any) {
		if (error.response?.body) {
			const errorBody = error.response.body;
			throw new Error(
				`SunX API Error: ${errorBody.err_msg || errorBody.message || JSON.stringify(errorBody)}`,
			);
		}
		throw error;
	}
}
