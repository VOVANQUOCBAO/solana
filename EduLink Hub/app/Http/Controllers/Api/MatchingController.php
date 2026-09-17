<?php

namespace App\Http\Controllers\Api;

use App\Models\Application;
use App\Models\Job;
use App\Services\MatchingService;
use Illuminate\Http\Request;

class MatchingController extends ApiController
{
    public function match(Request $request, Job $job, MatchingService $matching)
    {
        abort_unless($job->employer_id === $request->user()->id, 403);
        abort_unless($job->status === 'open', 409, 'Công việc phải ở trạng thái open.');

        $candidates = $matching->topCandidates($job);
        foreach ($candidates as $candidate) {
            Application::updateOrCreate(
                ['job_id' => $job->id, 'student_id' => $candidate['student_id']],
                [
                    'match_score' => $candidate['match_score'],
                    'ai_reason' => $candidate['reason'],
                    'source' => 'ai',
                    'status' => 'matched',
                ]
            );
        }

        return $this->success(
            $job->applications()->with('student.studentProfile')->orderByDesc('match_score')->get(),
            'Đã tạo danh sách ứng viên phù hợp.'
        );
    }

    public function candidates(Request $request, Job $job)
    {
        abort_unless($job->employer_id === $request->user()->id, 403);

        return $this->success(
            $job->applications()->with('student.studentProfile')->orderByDesc('match_score')->get(),
            'Lấy danh sách ứng viên thành công.'
        );
    }
}
