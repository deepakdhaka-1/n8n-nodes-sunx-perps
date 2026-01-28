import { IExecuteFunctions, IHttpRequestOptions, IHttpRequestMethods } from 'n8n-workflow';
import CryptoJS from 'crypto-js';

export interface SunxCredentials {
	accessKeyId: string;
	secretKey: string;
	baseUrl: string;
}

/**
 * Format timestamp as YYYY-MM-DDThh:mm:ss (without milliseconds or Z)
 * Then URL encode it
 */
function getTimestamp(): string {
	const now = new Date();
	const year = now.getUTCFullYear();
	const month = String(now.getUTCMonth() + 1).padStart(2, '0');
	const day = String(now.getUTCDate()).padStart(2, '0');
	const hours = String(now.getUTCHours()).padStart(2, '0');
	const minutes = String(now.getUTCMinutes()).padStart(2, '0');
	const seconds = String(now.getUTCSeconds()).padStart(2, '0');
	
	// Format: YYYY-MM-DDThh:mm:ss (not URL encoded yet)
	return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * URL encode with uppercase hex characters as per SunX requirements
 * : becomes %3A, space becomes %20, etc.
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
 * 
 * String to sign format:
 * METHOD\n
 * HOST\n
 * PATH\n
 * QUERY_STRING
 * 
 * Where QUERY_STRING is sorted by ASCII order and URL encoded
 */
export function generateSignature(
	method: string,
	host: string,
	path: string,
	params: { [key: string]: any },
	secretKey: string,
): string {
	// Sort parameters by key in ASCII order
	const sortedKeys = Object.keys(params).sort();
	
	// Build query string with URL-encoded values
	const queryParts: string[] = [];
	for (const key of sortedKeys) {
		const value = String(params[key]);
		// URL encode the value (key is not encoded)
		const encodedValue = urlEncodeValue(value);
		queryParts.push(`${key}=${encodedValue}`);
	}
	const queryString = queryParts.join('&');

	// Build string to sign
	// Format: METHOD\nHOST\nPATH\nQUERY_STRING
	const stringToSign = `${method}\n${host}\n${path}\n${queryString}`;

	// Generate HMAC-SHA256 signature
	const hash = CryptoJS.HmacSHA256(stringToSign, secretKey);
	
	// Return Base64 encoded signature
	return CryptoJS.enc.Base64.stringify(hash);
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
	additionalQs?: any,
): IHttpRequestOptions {
	// Get timestamp in format YYYY-MM-DDThh:mm:ss
	const timestamp = getTimestamp();
	
	// Parse URL
	const url = new URL(credentials.baseUrl + endpoint);
	const host = url.hostname; // e.g., api.sunx.io
	const path = url.pathname;  // e.g., /sapi/v1/account/balance

	// Build parameters object (before URL encoding for signature)
	const params: { [key: string]: string } = {
		AccessKeyId: credentials.accessKeyId,
		SignatureMethod: 'HmacSHA256',
		SignatureVersion: '2',
		Timestamp: timestamp, // Not URL encoded yet
	};

	// Add any additional query parameters
	if (additionalQs) {
		for (const key in additionalQs) {
			if (additionalQs[key] !== undefined && additionalQs[key] !== null && additionalQs[key] !== '') {
				params[key] = String(additionalQs[key]);
			}
		}
	}

	// Generate signature
	const signature = generateSignature(method, host, path, params, credentials.secretKey);
	
	// Add signature to params
	params.Signature = signature;

	// Build query string for the actual request (with URL encoding)
	const finalQs: { [key: string]: string } = {};
	for (const key in params) {
		finalQs[key] = params[key];
	}

	// Build request options
	const options: IHttpRequestOptions = {
		method,
		baseURL: credentials.baseUrl,
		url: path,
		qs: finalQs,
		headers: {
			'Content-Type': 'application/json',
		},
		json: true,
		skipSslCertificateValidation: true, // Ignore SSL errors
	};

	// Add body for POST/PUT
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
			const errorMessage = errorBody.err_msg || errorBody.message || JSON.stringify(errorBody);
			throw new Error(`SunX API Error: ${errorMessage}`);
		}
		throw new Error(`SunX API Error: ${error.message || 'Unknown error'}`);
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
		skipSslCertificateValidation: true, // Ignore SSL errors
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
