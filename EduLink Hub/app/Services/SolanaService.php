<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class SolanaService
{
    public function isMock(): bool
    {
        return config('edulink.blockchain_mode') === 'mock';
    }

    public function mockTransaction(string $action): string
    {
        return 'mock_'.$action.'_'.Str::uuid();
    }

    public function verifyTransaction(string $signature): bool
    {
        if ($this->isMock()) {
            return str_starts_with($signature, 'mock_') || filled($signature);
        }

        try {
            $response = Http::timeout(12)->post(config('edulink.solana_rpc_url'), [
                'jsonrpc' => '2.0',
                'id' => 1,
                'method' => 'getTransaction',
                'params' => [$signature, ['encoding' => 'json', 'maxSupportedTransactionVersion' => 0]],
            ]);
        } catch (\Throwable) {
            return false;
        }

        if (! $response->successful() || ! filled($response->json('result')) || $response->json('result.meta.err') !== null) {
            return false;
        }

        $programId = config('edulink.solana_program_id');
        $accountKeys = $response->json('result.transaction.message.accountKeys', []);

        return ! $programId || in_array($programId, $accountKeys, true);
    }
}
