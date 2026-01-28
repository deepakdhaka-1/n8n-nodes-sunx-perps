import {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class SunxPerpsApi implements ICredentialType {
	name = 'sunxPerpsApi';
	displayName = 'SunX Perps API';
	documentationUrl = 'https://sunx.gitbook.io/sunx/developer/';
	properties: INodeProperties[] = [
		{
			displayName: 'Access Key ID',
			name: 'accessKeyId',
			type: 'string',
			default: '',
			required: true,
			description: 'Your SunX API Access Key ID',
		},
		{
			displayName: 'Secret Key',
			name: 'secretKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your SunX API Secret Key',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.sunx.io',
			required: true,
			description: 'The base URL for SunX API',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {},
	};

	// Remove automatic test - credentials will be verified when first used
	// SunX API requires HMAC signature which is complex to test directly
}
