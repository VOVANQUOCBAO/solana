<?php

namespace App\Http\Controllers\Api;

use App\Models\Application;
use App\Models\Job;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ApplicationController extends ApiController
{
    public function apply(Request $request, Job $job)
    {
        if ($job->status !== 'open') {
            return $this->error('Công việc hiện không nhận ứng viên.', 409);
        }
        if (! $request->user()->wallet_address) {
            return $this->error('Bạn cần kết nối ví Solana trước khi nhận việc.', 409);
        }

        $application = Application::firstOrCreate(
            ['job_id' => $job->id, 'student_id' => $request->user()->id],
            ['source' => 'manual', 'status' => 'matched']
        );

        return $this->accept($request, $application);
    }

    public function accept(Request $request, Application $application)
    {
        abort_unless($application->student_id === $request->user()->id, 403);
        if (! $request->user()->wallet_address) {
            return $this->error('Bạn cần kết nối ví Solana trước khi nhận việc.', 409);
        }

        $result = DB::transaction(function () use ($application, $request) {
            $job = Job::query()->lockForUpdate()->findOrFail($application->job_id);
            if ($job->status !== 'open') {
                return null;
            }
            $application->update(['status' => 'accepted']);
            $job->applications()->whereKeyNot($application->id)->update(['status' => 'rejected']);
            $job->update(['status' => 'in_progress']);
            $job->escrow?->update(['student_wallet' => $request->user()->wallet_address]);

            return $application->fresh()->load('job');
        });

        return $result
            ? $this->success($result, 'Nhận việc thành công.')
            : $this->error('Công việc đã được người khác nhận hoặc không còn mở.', 409);
    }

    public function reject(Request $request, Application $application)
    {
        abort_unless($application->student_id === $request->user()->id, 403);
        abort_unless($application->status === 'matched', 409, 'Chỉ có thể từ chối đề xuất đang chờ.');
        $application->update(['status' => 'rejected']);

        return $this->success($application, 'Đã từ chối công việc.');
    }
}
