class ConfigGenerator {
    generateKeys() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        const privateKey = btoa(String.fromCharCode.apply(null, array));
        return { privateKey };
    }

    async generateConfigFromAPI(token, options) {
        const response = await fetch('/api/config/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(options)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to generate configuration');
        }

        return data;
    }

    downloadConfig(config, filename = 'wireguard.conf') {
        const blob = new Blob([config], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    copyToClipboard(text) {
        return navigator.clipboard.writeText(text);
    }
}

const configGenerator = new ConfigGenerator();
export default configGenerator;
