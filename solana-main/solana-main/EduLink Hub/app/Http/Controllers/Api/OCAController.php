<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\OCAService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OCAController extends Controller
{
    public function __construct(
        protected OCAService $ocaService
    ) {}

    /**
     * Issue an Open Campus Achievement / SBT badge to a student.
     * Endpoint: POST /api/oca/issue
     */
    public function issue(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'issuer' => 'nullable|string|max:255',
            'skills' => 'nullable',
        ]);

        $student = User::where('id', $validated['student_id'])
            ->where('role', 'student')
            ->first();

        if (! $student) {
            return response()->json([
                'message' => 'Người dùng không phải là Sinh viên hoặc không tồn tại.',
            ], 422);
        }

        $credential = $this->ocaService->issueBadge($student, $validated);

        return response()->json([
            'message' => 'Phát hành chứng chỉ Open Campus Achievement (OCA) thành công!',
            'credential' => $credential,
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'email' => $student->email,
                'ocid' => $student->ocid,
            ],
        ], 201);
    }
}
