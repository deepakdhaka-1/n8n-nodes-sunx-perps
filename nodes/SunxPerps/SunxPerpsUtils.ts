import { IExecuteFunctions, IHttpRequestOptions, IHttpRequestMethods } from 'n8n-workflow';
import CryptoJS from 'crypto-js';

export interface SunxCredentials {
	accessKeyId: string;
	secretKey: string;
	baseUrl: string;
}

/**
 * Format timestamp as YYYY-MM-DDThh:mm:ss
 */
function getTimestamp(): string {
	const now = new Date();
	const year = now.getUTCFullYear();
	const month = String(now.getUTCMonth() + 1).padStart(2, '0');
	const day = String(now.getUTCDate()).padStart(2, '0');
	const hours = String(now.getUTCHours()).padStart(2, '0');
	const minutes = String(now.getUTCMinutes()).padStart(2, '0');
	const seconds = String(now.getUTCSeconds()).padStart(2, '0');
	
	return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * URL encode with uppercase hex
 */
function urlEncodeValue(str: string): string {
	return encodeURIComponent(str)
		.replace(/!/g, '%21')
		.replace(/'/g, '%27')
		.replace(/\(/g, '%28')
		.replace(/\)/g, '%29')
		.replace(/\*/g, '%2A');
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
	// Sort parameters by key
	const sortedKeys = Object.keys(params).sort();
	
	// Build query string with URL-encoded values
	const queryParts: string[] = [];
	for (const key of sortedKeys) {
		const value = String(params[key]);
		const encodedValue = urlEncodeValue(value);
		queryParts.push(`${key}=${encodedValue}`);
	}
	const queryString = queryParts.join('&');

	// Build string to sign: METHOD\nHOST\nPATH\nQUERY_STRING
	const stringToSign = `${method}\n${host}\n${path}\n${queryString}`;

	// Generate HMAC-SHA256 signature
	const hash = CryptoJS.HmacSHA256(stringToSign, secretKey);
	
	// Return Base64 encoded signature
	return CryptoJS.enc.Base64.stringify(hash);
}

/**
 * Build authenticated request
 */
export function buildAuthenticatedRequest(
	this: IExecuteFunctions,
	credentials: SunxCredentials,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: any,
	additionalQs?: any,
): IHttpRequestOptions {
	const timestamp = getTimestamp();
	
	// Parse URL
	const fullUrl = credentials.baseUrl + endpoint;
	const url = new URL(fullUrl);
	const host = url.hostname;
	const path = url.pathname;

	// Build parameters for signature
	const params: { [key: string]: string } = {
		AccessKeyId: credentials.accessKeyId,
		SignatureMethod: 'HmacSHA256',
		SignatureVersion: '2',
		Timestamp: timestamp,
	};

	// Add additional query params if any
	if (additionalQs) {
		for (const key in additionalQs) {
			if (additionalQs[key] !== undefined && additionalQs[key] !== null && additionalQs[key] !== '') {
				params[key] = String(additionalQs[key]);
			}
		}
	}

	// Generate signature
	const signature = generateSignature(method, host, path, params, credentials.secretKey);
	params.Signature = signature;

	// Build request
	const options: IHttpRequestOptions = {
		method,
		url: fullUrl,
		qs: params,
		headers: {
			'Content-Type': 'application/json',
		},
		json: true,
		skipSslCertificateValidation: true,
	};

	// Add body for POST/PUT
	if (body && (method === 'POST' || method === 'PUT')) {
		options.body = body;
	}

	return options;
}

/**
 * Make authenticated API request
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
			const errorMessage = errorBody.err_msg || errorBody.message || JSON.stringify(errorBody);
			throw new Error(`SunX API Error: ${errorMessage}`);
		}
		throw new Error(`SunX API Error: ${error.message || 'Unknown error'}`);
	}
}

/**
 * Make public API request (no auth)
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
		skipSslCertificateValidation: true,
	};

	try {
		return await this.helpers.httpRequest(options);
	} catch (error: any) {
		if (error.response?.body) {
			const errorBody = error.response.body;
			const errorMessage = errorBody.err_msg || errorBody.message || JSON.stringify(errorBody);
			throw new Error(`SunX API Error: ${errorMessage}`);
		}
		throw new Error(`SunX API Error: ${error.message || 'Unknown error'}`);
	}
}
