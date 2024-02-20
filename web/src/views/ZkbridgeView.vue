<template>
    <div class="pb-5">
        <div class="min-w-full text-center header pb-4 pt-4">
            <h1 class="text-3xl">ZkBridge</h1>
        </div>
        <table class="min-w-full border text-center text-sm font-light dark:border-gray-700" v-if="isDataLoaded && !isError">
            <thead class="border-b font-medium dark:border-gray-700">
                <tr>
                    <th v-for="(head, index) in headers" :key="index" :class="thClass" @click="sort(head)">{{ head }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(item, index) in sortedData" :key="index" class="border-b dark:border-gray-700">
                    <td :class="tdClass">{{ item['n'] }}</td>
                    <td :class="tdClass + ' text-left'">
                        <div class="flex space-x-2 pt-3 pb-2">
                            <strong>{{ item['Wallet'] }}</strong>
                            <div class="h-4 w-4">
                                <a target="_blank" :href="'https://debank.com/profile/'+item['Wallet']"><img class="rounded-full mb-1" :src="'/debank.png'" alt=""></a>
                            </div>
                        </div>
                    </td>
                    <td :class="tdClass">{{ item['GalxePoints'] }}</td>
                    <td :class="tdClass">{{ item['TX Count'] }}</td>
                    <td :class="tdClass">{{ item['Msg tx count'] }}</td>
                    <td :class="tdClass">{{ item['NFT tx count'] }}</td>
                    <td :class="tdClass">{{ item['Token tx count'] }}</td>
                    <td :class="tdClass">${{ item['Volume'] }}</td>
                    <td :class="tdClass">{{ item['Source chains'] }}</td>
                    <td :class="tdClass + ' text-left'">
                        <div class="flex space-x-2 pt-3 pb-4 select-none max-w-sm">
                            <div class="h-4 w-4 text-center" v-for="source in item['sources']" :key="source" :title="names[source]">
                                <img class="rounded-full mb-1" :src="chains[source]" :alt="source">
                            </div>
                        </div>
                    </td>
                    <td :class="tdClass">{{ item['Dest chains'] }}</td>
                    <td :class="tdClass + ' text-left'">
                        <div class="grid grid-flow-row auto-rows-max gap-2 pt-3 pb-4 select-none max-w-sm justify-center items-center">
                            <div class="h-4 w-4 text-center" v-for="source in item['dests']" :key="source" :title="names[source]">
                                <img class="rounded-full mb-1" :src="chains[source]" :alt="source">
                            </div>
                        </div>
                    </td>
                    <td :class="tdClass">{{ item['Days'] }}</td>
                    <td :class="tdClass">{{ item['Weeks'] }}</td>
                    <td :class="tdClass">{{ item['Months'] }}</td>
                    <td :class="tdClass">{{ formatDate(item['First TX']) }}</td>
                    <td :class="tdClass">{{ formatDate(item['Last TX']) }}</td>
                </tr>
            </tbody>
        </table>
        <div class="text-center text-2xl" v-if="!isDataLoaded && !isError">
          Data loading...
        </div>

        <div class="text-center text-2xl" v-if="isError">
          Error: {{ error }}
        </div>
    </div>
</template>

<script>

import {sortMethods} from "@/utils/sorting"
import {formatDate} from "@/utils/formatDate"
import {thClass, tdClass} from "@/utils/tableClass"

export default {
    data() {
        return {
            chains: {
                56: "https://metaid.zkbridge.com/ipfs/QmYE28H3ncCfJpPpBTHjctS8JXqpAE2PcpyASXskJX7W3x",
                204: "https://metaid.zkbridge.com/ipfs/QmXZ6rJVuQvUEAmyXqf3ge8F9MPBmpsFTyw8JuAPrd1ZGz",
                1: "https://metaid.zkbridge.com/ipfs/QmQwHJfugddURdgb7sRDDcmB1KQ5agEwr3x8ycMzn4oivp",
                137: "https://metaid.zkbridge.com/ipfs/QmTGWBsfRcZxp271EZjSyG4rVc5tNqfM2QgYYDE2g5Tha4",
                9980: "https://metaid.zkbridge.com/ipfs/Qme8ZfwnXySMo9guJ8L4SaMpz8yctoXUSBhjK8ejLWQKFf",
                42161: "https://metaid.zkbridge.com/ipfs/QmNtqDmGK8pAkk2DE5AM1nTyfwXx8mX5n1z4TtsEuX1MCG",
                59144: "https://metaid.zkbridge.com/ipfs/QmZrLSqUGhHsjTpzKi44KM9kARuUduRJZP6Tojj6cQV2jp",
                8453: "https://metaid.zkbridge.com/ipfs/QmYApnAuqM3NNFUebWe6JFUWpfJ2JptwjsXMZak7xHzE8Q",
                10: "https://metaid.zkbridge.com/ipfs/QmWs2tYY2uFhPdDnHuX3qPSyq5wk5fVo6YMevEVFzb6pGR",
                534352: "https://metaid.zkbridge.com/ipfs/QmNTeXADBrwZLaVJ5BvTYj4PRjy46RVvCmH1feth45qJ9j",
                5000: "https://metaid.zkbridge.com/ipfs/QmRBFhRTDF5Nrt4cVZdfCXGUpVjEgmmg1uhcvFQjdnZXCH",
                1116: "https://metaid.zkbridge.com/ipfs/QmVanQW9TArscCkfzEc7LE7KeDjQGMZaMQ3GG4YcV13rP5",
                42220: "https://metaid.zkbridge.com/ipfs/Qme4XCrAWB9ktxnG2ohQZsPERhWwRRzNuJurhU5Cu58awC",
                42170: "https://metaid.zkbridge.com/ipfs/QmZJZEXkrZz19nZ3Qtrp9CmvzaDGyh9niz4mknV451nZoR",
                169: "https://metaid.zkbridge.com/ipfs/QmU2xMH85iyrw8cyWRkRNjTzmZm3s2oDPB5HdcxNRSD9wa",
                8217: "https://metaid.zkbridge.com/ipfs/QmXTajaUkm9JKvYr5WTdmPr4UFWcaX5M9PeE3YL9gYSpuv",
                1284: "https://metaid.zkbridge.com/ipfs/QmTzZMPaGi7G7LDvcGFqzy6mJnJdmEkTsHDX1ZPHgWq34R",
                100: "https://metaid.zkbridge.com/ipfs/QmTjNviQP35skTW7Tp3FEM1Fz4HdYCEtkVyPRNXAT2DUVM",
                43114: "https://metaid.zkbridge.com/ipfs/QmRvckcMjKbiKTGopttPLpRdSMSfPWkkGdMCrYdj5Au3VB",
                250: "https://metaid.zkbridge.com/ipfs/QmWBgdmkY6YoaWGCqEmSCsZ54DfFBGNbDTaAEr7bXRi1ZH",
                1088: "https://metaid.zkbridge.com/ipfs/QmRiDaenMbJGxssJDBdTFyFvzGhHDHtqynV5dtAPhgFPpu",
                324: "https://metaid.zkbridge.com/ipfs/QmXHne2TfV4CRHq6DQzVgZBrJFHg4YcMCodzBPDshG6hTo",
                42262: "https://metaid.zkbridge.com/ipfs/QmdqJYRFxUoCTkLoYKz2AKxj6CjQZ89jfmNuxpTrkjTPTv",
                97: "https://metaid.zkbridge.com/ipfs/QmTBAngYXaK454QRuCFbeFdY3hffRLjef1PhJNvK9ysxQ4",
                5611: "https://metaid.zkbridge.com/ipfs/QmY6ek9T5aYATeDgMe35dKFK1okE5etr1ynUE4M115ETWw",
                5: "https://metaid.zkbridge.com/ipfs/QmQwHJfugddURdgb7sRDDcmB1KQ5agEwr3x8ycMzn4oivp",
                11155111: "https://metaid.zkbridge.com/ipfs/QmQwHJfugddURdgb7sRDDcmB1KQ5agEwr3x8ycMzn4oivp",
                80001: "https://metaid.zkbridge.com/ipfs/QmTGWBsfRcZxp271EZjSyG4rVc5tNqfM2QgYYDE2g5Tha4",
                421613: "https://metaid.zkbridge.com/ipfs/QmNtqDmGK8pAkk2DE5AM1nTyfwXx8mX5n1z4TtsEuX1MCG",
                43113: "https://metaid.zkbridge.com/ipfs/QmRvckcMjKbiKTGopttPLpRdSMSfPWkkGdMCrYdj5Au3VB",
                4002: "https://metaid.zkbridge.com/ipfs/QmWBgdmkY6YoaWGCqEmSCsZ54DfFBGNbDTaAEr7bXRi1ZH",
                59140: "https://metaid.zkbridge.com/ipfs/QmZrLSqUGhHsjTpzKi44KM9kARuUduRJZP6Tojj6cQV2jp",
                420: "https://metaid.zkbridge.com/ipfs/QmWs2tYY2uFhPdDnHuX3qPSyq5wk5fVo6YMevEVFzb6pGR",
                91715: "https://metaid.zkbridge.com/ipfs/QmWNevgHPoraMQYCuvTJxBGF9T2vf7BKtQ2WNSbpg67t6Z",
                588: "https://metaid.zkbridge.com/ipfs/QmRiDaenMbJGxssJDBdTFyFvzGhHDHtqynV5dtAPhgFPpu",
                1287: "https://metaid.zkbridge.com/ipfs/QmTzZMPaGi7G7LDvcGFqzy6mJnJdmEkTsHDX1ZPHgWq34R",
                167005: "https://metaid.zkbridge.com/ipfs/QmcgUwYGCrPTvob9hSRwpHLmvUpyVp54b4CHtW9PowPhwA",
                167007: "https://metaid.zkbridge.com/ipfs/QmcgUwYGCrPTvob9hSRwpHLmvUpyVp54b4CHtW9PowPhwA",
                5001: "https://metaid.zkbridge.com/ipfs/QmX7HEqhRkw8PuP8JL52etSwVowqhgZ7q9kbe77vSaXDam",
                534353: "https://metaid.zkbridge.com/ipfs/QmNTeXADBrwZLaVJ5BvTYj4PRjy46RVvCmH1feth45qJ9j",
                3441005: "https://metaid.zkbridge.com/ipfs/QmekQvuJeEjpArjUh2LaUk4HD8prrpUu4387A1fxqUnGuW",
                9000: "https://metaid.zkbridge.com/ipfs/QmVkNAq7AcZZBoWCjZNJz1xNBpRDC3NucL9LycydCP7CQL",
                42261: "https://metaid.zkbridge.com/ipfs/QmdqJYRFxUoCTkLoYKz2AKxj6CjQZ89jfmNuxpTrkjTPTv",
            },
            names: {
                56: "BNB Chain",
                204: "opBNB",
                1: "Ethereum",
                137: "Polygon",
                9980: "Combo",
                42161: "Arbitrum One",
                59144: "Linea",
                8453: "Base",
                10: "Optimism",
                534352: "Scroll",
                5000: "Mantle",
                1116: "Core Dao",
                42220: "Celo",
                42170: "Arbitrum Nova",
                169: "Manta Pacific",
                8217: "Klaytn",
                1284: "Moonbeam",
                100: "Gnosis Chain",
                43114: "Avalanche",
                250: "Fantom",
                1088: "Metis",
                324: "zkSync Era",
                42262: "Oasis",
                97: "BNB Chain Testnet",
                5611: "opBNB Testnet",
                5: "Ethereum Goerli Testnet",
                11155111: "Ethereum Sepolia Testnet",
                80001: "Polygon Testnet",
                421613: "Arbitrum One Testnet",
                43113: "Avalanche Testnet",
                4002: "Fantom Testnet",
                59140: "Linea Testnet",
                420: "Optimism Testnet",
                91715: "Combo Testnet",
                588: "Metis Testnet",
                1287: "Moonbase Testnet",
                167005: "Taiko Grimsvotn L2",
                167007: "Taiko Jolnir L2",
                5001: "Mantle Testnet",
                534353: "Scroll Alpha",
                3441005: "Manta Pacific Testnet",
                9000: "Evmos Testnet",
                42261: "Oasis Emerald Testnet",
            },
            isDataLoaded: false,
            isError: false,
            error: '',
            data: [],
            thClass: thClass,
            tdClass: tdClass,
            sortDirection: 1,
            sortBy: 'n',
            headers: [
                'n',
                'Wallet',
                'GalxePoints',
                'TX Count',
                'Msg tx count',
                'NFT tx count',
                'Token tx count',
                'Volume',
                'Source chains',
                'Source list',
                'Dest chains',
                'Dest list',
                'Days',
                'Weeks',
                'Months',
                'First TX',
                'Last TX',
            ]
        }
    },
    created() {
        this.loadData()
    },
    computed: {
        sortedData: {
            get() {
                return this.data
            },
            set(value) {
                this.data = value
            },
        },
    },
    methods: {
        formatDate,
        loadData() {
            this.$axios.get('/api/zkbridge').then((response) => {
                this.data = response.data.sort((a, b) => a.n - b.n)
                this.isDataLoaded = true
            }).catch((error) => {
                this.isError = true
                this.error = error.toString()
            })
        },
        sort(head) {
            this.sortBy = head
            this.sortDirection *= -1
            this.sortData()
        },
        sortData() {
            const type = this.sortBy === 'name' ? 'String' : 'Number'
            const direction = this.sortDirection
            const head = this.sortBy
            this.sortedData = this.data.slice().sort(sortMethods(type, head, direction))
        }
    },
}
</script>

<style>
.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(24px, 1fr));
    gap: 8px;
    align-items: center;
    justify-content: center;
    max-width: 180px;
}
</style>
