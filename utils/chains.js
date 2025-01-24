import { ethPrice, maticPrice, bnbPrice, avaxPrice, corePrice, celoPrice, klayPrice, ftmPrice, glmrPrice, movrPrice} from "../utils/common.js"
import { defineChain } from 'viem'

export const zero = defineChain({
    id: 543210,
    name: 'Zero',
    network: 'zero',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.zerion.io/v1/zero'],
        },
        public: {
            http: ['https://rpc.zerion.io/v1/zero'],
        },
    },
    blockExplorers: {
        default: { name: 'Explorer', url: 'https://explorer.zero.network' },
    }
})

export const chains = {
    'ETH': {
        'nativePrice': ethPrice,
        'USDT': {
            address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            decimals: 6
        },
        'USDC': {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            decimals: 18
        },
        'DAI': {
            address: '0x6b175474e89094c44da98b954eedeac495271d0f',
            decimals: 18
        }
    },
    'Arbitrum': {
        'nativePrice': ethPrice,
        'USDT': {
            address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
            decimals: 6
        },
        'USDC': {
            address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            decimals: 18
        },
        'USDC.e': {
            address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
            decimals: 6
        },
        'DAI': {
            address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
            decimals: 18
        }
    },
    'Optimism': {
        'nativePrice': ethPrice,
        'USDT': {
            address: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
            decimals: 6
        },
        'USDC': {
            address: '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
            decimals: 18
        },
        'DAI': {
            address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
            decimals: 18
        }
    },
    'Linea': {
        'nativePrice': ethPrice,
        'USDT': {
            address: '0xA219439258ca9da29E9Cc4cE5596924745e12B93',
            decimals: 6
        },
        'USDC': {
            address: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
            decimals: 6
        },
        'DAI': {
            address: '0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5',
            decimals: 18
        }
    },
    'Polygon': {
        'USDT': {
            address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
            decimals: 6
        },
        'USDC': {
            address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
            decimals: 18
        },
        'DAI': {
            address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
            decimals: 18
        },
        'nativePrice': maticPrice
    },
    'BSC': {
        'USDT': {
            address: '0x55d398326f99059ff775485246999027b3197955',
            decimals: 18
        },
        'USDC': {
            address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
            decimals: 18
        },
        'DAI': {
            address: '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3',
            decimals: 18
        },
        'nativePrice': bnbPrice
    },
    'Avalanche': {
        'USDT': {
            address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
            decimals: 6
        },
        'USDC': {
            address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
            decimals: 18
        },
        'USDC.e': {
            address: '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664',
            decimals: 18
        },
        'DAI': {
            address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70',
            decimals: 18
        },
        'nativePrice': avaxPrice
    },
    'Base': {
        'USDT': {
            address: '0x50c5725949a6f0c72e6c4a641f24049a917db0cb',
            decimals: 18
        },
        'USDC': {
            address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
            decimals: 6
        },
        'nativePrice': ethPrice
    },
    'Core': {
        'USDT': {
            address: '0x900101d06a7426441ae63e9ab3b9b0f63be145f1',
            decimals: 6
        },
        'USDC': {
            address: '0xa4151b2b3e269645181dccf2d426ce75fcbdeca9',
            decimals: 6
        },
        'nativePrice': corePrice
    },
    'opBNB': {
        'USDT': {
            address: '0x9e5aac1ba1a2e6aed6b32689dfcf62a509ca96f3',
            decimals: 6
        },
        'nativePrice': bnbPrice
    },
    'Celo': {
        'USDT': {
            address: '0xb020D981420744F6b0FedD22bB67cd37Ce18a1d5',
            decimals: 6
        },
        'USDC': {
            address: '0xef4229c8c3250c675f21bcefa42f58efbff6002a',
            decimals: 6
        },
        'nativePrice': celoPrice
    },
    'Klaytn': {
        'USDT': {
            address: '0xcee8faf64bb97a73bb51e115aa89c17ffa8dd167',
            decimals: 6
        },
        'nativePrice': klayPrice
    },
    'Fantom': {
        'USDT': {
            address: '0x049d68029688eabf473097a2fc38ef61633a3c7a',
            decimals: 6
        },
        'USDC': {
            address: '0x818ec0a7fe18ff94269904fced6ae3dae6d6dc0b',
            decimals: 6
        },
        'nativePrice': ftmPrice
    },
    'Moonbeam': {
        'USDT': {
            address: '0xefaeee334f0fd1712f9a8cc375f427d9cdd40d73',
            decimals: 6
        },
        'USDC': {
            address: '0x818ec0a7fe18ff94269904fced6ae3dae6d6dc0b',
            decimals: 6
        },
        'nativePrice': glmrPrice
    },
    'Moonriver': {
        'USDT': {
            address: '0xe936caa7f6d9f5c9e907111fcaf7c351c184cda7',
            decimals: 6
        },
        'USDC': {
            address: '0xe3f5a90f9cb311505cd691a46596599aa1a0ad7d',
            decimals: 6
        },
        'nativePrice': movrPrice
    },
    'Redstone': {
        'nativePrice': ethPrice
    },
    'Blast': {
        'nativePrice': ethPrice,
        'USDB': {
            address: '0x4300000000000000000000000000000000000003',
            decimals: 18
        },
    },
    'Taiko': {
        'nativePrice': ethPrice,
        'USDT': {
            address: '0x9c2dc7377717603eb92b2655c5f2e7997a4945bd',
            decimals: 6
        },
        'USDC': {
            address: '0x07d83526730c7438048d55a4fc0b850e2aab6f0b',
            decimals: 6
        },
        'USDC.e': {
            address: '0x19e26B0638bf63aa9fa4d14c6baF8D52eBE86C5C',
            decimals: 6
        },
        'DAI': {
            address: '0x7d02A3E0180451B17e5D7f29eF78d06F8117106C',
            decimals: 18
        },
    },
    'Manta': {
        'nativePrice': ethPrice,
        'USDT': {
            address: '0xf417f5a458ec102b90352f697d6e2ac3a3d2851f',
            decimals: 6
        },
        'USDC': {
            address: '0xb73603c5d87fa094b7314c74ace2e64d165016fb',
            decimals: 6
        },
        'DAI': {
            address: '0x1c466b9371f8aba0d7c458be10a62192fcb8aa71',
            decimals: 18
        },
    },
    'Zero': {
        'nativePrice': ethPrice
    },
    'Ink': {
        'nativePrice': ethPrice
    },
}