<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;

class ProfileController extends ApiController
{
    public function update(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'ocid' => ['sometimes', 'nullable', 'string', 'max:255', 'unique:users,ocid,'.$user->id],
            'university' => ['sometimes', 'nullable', 'string', 'max:255'],
            'major' => ['sometimes', 'nullable', 'string', 'max:255'],
            'skills' => ['sometimes', 'array'],
            'skills.*' => ['string', 'max:100'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:3000'],
            'sbt_data' => ['sometimes', 'nullable', 'array'],
            'availability' => ['sometimes', 'boolean'],
        ]);

        $user->update(collect($data)->only(['name', 'ocid'])->all());
        if ($user->role === 'student') {
            $user->studentProfile()->updateOrCreate(
                ['user_id' => $user->id],
                collect($data)->only(['university', 'major', 'skills', 'bio', 'sbt_data', 'availability'])->all()
            );
        }

        return $this->success($user->fresh()->load('studentProfile'), 'Cập nhật hồ sơ thành công.');
    }

    public function connectWallet(Request $request)
    {
        $data = $request->validate([
            'wallet_address' => ['required', 'string', 'regex:/^[1-9A-HJ-NP-Za-km-z]{32,44}$/', 'unique:users,wallet_address,'.$request->user()->id],
        ], ['wallet_address.regex' => 'Địa chỉ ví Solana không hợp lệ.']);

        $request->user()->update($data);

        return $this->success(['wallet_address' => $data['wallet_address']], 'Kết nối ví thành công.');
    }
}
