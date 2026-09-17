<?php

use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DisputeController;
use App\Http\Controllers\Api\EscrowController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\MatchingController;
use App\Http\Controllers\Api\MilestoneController;
use App\Http\Controllers\Api\ProfileController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/jobs', [JobController::class, 'index']);
Route::get('/jobs/{job}', [JobController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/wallet/connect', [ProfileController::class, 'connectWallet']);

    Route::middleware('role:employer')->group(function () {
        Route::post('/jobs', [JobController::class, 'store']);
        Route::put('/jobs/{job}', [JobController::class, 'update']);
        Route::delete('/jobs/{job}', [JobController::class, 'destroy']);
        Route::post('/jobs/{job}/match', [MatchingController::class, 'match']);
        Route::get('/jobs/{job}/candidates', [MatchingController::class, 'candidates']);
        Route::post('/jobs/{job}/escrow', [EscrowController::class, 'store']);
        Route::post('/escrows/{escrow}/verify', [EscrowController::class, 'verify']);
        Route::post('/escrows/{escrow}/release', [EscrowController::class, 'release']);
        Route::post('/escrows/{escrow}/refund', [EscrowController::class, 'refund']);
        Route::post('/milestones/{milestone}/approve', [MilestoneController::class, 'approve']);
        Route::post('/milestones/{milestone}/reject', [MilestoneController::class, 'reject']);
    });

    Route::middleware('role:student')->group(function () {
        Route::post('/jobs/{job}/apply', [ApplicationController::class, 'apply']);
        Route::post('/applications/{application}/accept', [ApplicationController::class, 'accept']);
        Route::post('/applications/{application}/reject', [ApplicationController::class, 'reject']);
        Route::post('/milestones/{milestone}/submit', [MilestoneController::class, 'submit']);
    });

    Route::get('/escrows/{escrow}', [EscrowController::class, 'show']);
    Route::post('/milestones/{milestone}/dispute', [DisputeController::class, 'store']);
    Route::get('/disputes/{dispute}', [DisputeController::class, 'show']);
    Route::post('/disputes/{dispute}/vote', [DisputeController::class, 'vote'])->middleware('role:mentor');
    Route::post('/disputes/{dispute}/resolve', [DisputeController::class, 'resolve'])->middleware('role:admin');
});

require __DIR__.'/workspace.php';
