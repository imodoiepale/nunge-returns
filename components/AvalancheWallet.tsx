'use client'

import { useState } from 'react'
import { avalancheService } from '../services/avalancheService'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import toast from 'react-hot-toast'

export function AvalancheWallet() {
    const [address, setAddress] = useState('')
    const [balance, setBalance] = useState('')
    const [recipientAddress, setRecipientAddress] = useState('')
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)

    const createNewWallet = () => {
        try {
            const wallet = avalancheService.createWallet()
            setAddress(wallet.address)
            toast.success('New wallet created!')
            console.log('Wallet created:', wallet)
        } catch (error) {
            toast.error('Failed to create wallet')
            console.error('Error creating wallet:', error)
        }
    }

    const checkBalance = async () => {
        if (!address) {
            toast.error('Please enter an address')
            return
        }
        
        setLoading(true)
        try {
            const balance = await avalancheService.getBalance(address)
            setBalance(balance)
            toast.success('Balance retrieved!')
        } catch (error) {
            toast.error('Failed to get balance')
            console.error('Error getting balance:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-4 space-y-4">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">Avalanche Wallet</h2>
                <Button onClick={createNewWallet}>Create New Wallet</Button>
            </div>

            <div className="space-y-2">
                <Label htmlFor="address">Wallet Address</Label>
                <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter wallet address"
                />
            </div>

            <div className="space-y-2">
                <Button 
                    onClick={checkBalance}
                    disabled={loading}
                >
                    Check Balance
                </Button>
                {balance && (
                    <p className="text-sm">Balance: {balance} AVAX</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                    id="recipient"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="Enter recipient address"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="amount">Amount (AVAX)</Label>
                <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount to send"
                />
            </div>
        </div>
    )
}
