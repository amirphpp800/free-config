const LOCATIONS = [
    {
        id: 'us',
        name: 'United States',
        city: 'New York',
        flag: '🇺🇸',
        dns: {
            ipv4: ['1.1.1.1', '8.8.8.8'],
            ipv6: ['2606:4700:4700::1111', '2001:4860:4860::8888']
        },
        endpoint: 'us-ny.vpn.example.com:51820',
        latency: '~45ms'
    },
    {
        id: 'de',
        name: 'Germany',
        city: 'Frankfurt',
        flag: '🇩🇪',
        dns: {
            ipv4: ['1.1.1.1', '9.9.9.9'],
            ipv6: ['2606:4700:4700::1111', '2620:fe::fe']
        },
        endpoint: 'de-fra.vpn.example.com:51820',
        latency: '~85ms'
    },
    {
        id: 'nl',
        name: 'Netherlands',
        city: 'Amsterdam',
        flag: '🇳🇱',
        dns: {
            ipv4: ['1.1.1.1', '8.8.4.4'],
            ipv6: ['2606:4700:4700::1001', '2001:4860:4860::8844']
        },
        endpoint: 'nl-ams.vpn.example.com:51820',
        latency: '~75ms'
    },
    {
        id: 'uk',
        name: 'United Kingdom',
        city: 'London',
        flag: '🇬🇧',
        dns: {
            ipv4: ['1.0.0.1', '8.8.8.8'],
            ipv6: ['2606:4700:4700::1001', '2001:4860:4860::8888']
        },
        endpoint: 'uk-lon.vpn.example.com:51820',
        latency: '~65ms'
    },
    {
        id: 'fr',
        name: 'France',
        city: 'Paris',
        flag: '🇫🇷',
        dns: {
            ipv4: ['1.1.1.1', '80.67.169.12'],
            ipv6: ['2606:4700:4700::1111', '2001:910:800::12']
        },
        endpoint: 'fr-par.vpn.example.com:51820',
        latency: '~80ms'
    },
    {
        id: 'jp',
        name: 'Japan',
        city: 'Tokyo',
        flag: '🇯🇵',
        dns: {
            ipv4: ['1.1.1.1', '8.8.8.8'],
            ipv6: ['2606:4700:4700::1111', '2001:4860:4860::8888']
        },
        endpoint: 'jp-tky.vpn.example.com:51820',
        latency: '~120ms'
    },
    {
        id: 'sg',
        name: 'Singapore',
        city: 'Singapore',
        flag: '🇸🇬',
        dns: {
            ipv4: ['1.1.1.1', '8.8.8.8'],
            ipv6: ['2606:4700:4700::1111', '2001:4860:4860::8888']
        },
        endpoint: 'sg-sin.vpn.example.com:51820',
        latency: '~150ms'
    },
    {
        id: 'au',
        name: 'Australia',
        city: 'Sydney',
        flag: '🇦🇺',
        dns: {
            ipv4: ['1.1.1.1', '8.8.8.8'],
            ipv6: ['2606:4700:4700::1111', '2001:4860:4860::8888']
        },
        endpoint: 'au-syd.vpn.example.com:51820',
        latency: '~180ms'
    },
    {
        id: 'ca',
        name: 'Canada',
        city: 'Toronto',
        flag: '🇨🇦',
        dns: {
            ipv4: ['1.1.1.1', '8.8.8.8'],
            ipv6: ['2606:4700:4700::1111', '2001:4860:4860::8888']
        },
        endpoint: 'ca-tor.vpn.example.com:51820',
        latency: '~55ms'
    },
    {
        id: 'ch',
        name: 'Switzerland',
        city: 'Zurich',
        flag: '🇨🇭',
        dns: {
            ipv4: ['185.95.218.42', '185.95.218.43'],
            ipv6: ['2a05:fc84::42', '2a05:fc84::43']
        },
        endpoint: 'ch-zur.vpn.example.com:51820',
        latency: '~90ms'
    },
    {
        id: 'se',
        name: 'Sweden',
        city: 'Stockholm',
        flag: '🇸🇪',
        dns: {
            ipv4: ['1.1.1.1', '9.9.9.9'],
            ipv6: ['2606:4700:4700::1111', '2620:fe::fe']
        },
        endpoint: 'se-sto.vpn.example.com:51820',
        latency: '~95ms'
    },
    {
        id: 'fi',
        name: 'Finland',
        city: 'Helsinki',
        flag: '🇫🇮',
        dns: {
            ipv4: ['1.1.1.1', '8.8.8.8'],
            ipv6: ['2606:4700:4700::1111', '2001:4860:4860::8888']
        },
        endpoint: 'fi-hel.vpn.example.com:51820',
        latency: '~100ms'
    }
];

function getLocationById(id) {
    return LOCATIONS.find(loc => loc.id === id);
}

function getAllLocations() {
    return LOCATIONS;
}

export { LOCATIONS, getLocationById, getAllLocations };
