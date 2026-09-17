<?php

namespace App\Http\Controllers\Api;

use App\Models\Dispute;
use App\Models\DisputeVote;
use App\Models\Milestone;
use Illuminate\Http\Request;

class DisputeController extends ApiController
{
    public function store(Request $request, Milestone $milestone)
    {
        $job = $milestone->job;
        $isEmployer = $job->employer_id === $request->user()->id;
        $isStudent = $job->applications()->where('student_id', $request->user()->id)->where('status', 'accepted')->exists();
        abort_unless($isEmployer || $isStudent, 403, 'Bạn không tham gia công việc này.');
        abort_unless(in_array($milestone->status, ['submitted', 'approved'], true), 409, 'Milestone chưa thể mở tranh chấp.');

        $data = $request->validate([
            'reason' => ['required', 'string', 'max:5000'],
            'evidence' => ['nullable', 'array'],
            'evidence.*' => ['string', 'max:2048'],
        ]);
        $dispute = Dispute::create($data + [
            'milestone_id' => $milestone->id,
            'created_by' => $request->user()->id,
            'status' => 'open',
        ]);
        $milestone->update(['status' => 'disputed']);
        $job->update(['status' => 'disputed']);

        return $this->success($dispute, 'Tạo tranh chấp thành công.', 201);
    }

    public function show(Request $request, Dispute $dispute)
    {
        $job = $dispute->milestone->job;
        $canView = in_array($request->user()->role, ['mentor', 'admin'], true)
            || $job->employer_id === $request->user()->id
            || $job->applications()->where('student_id', $request->user()->id)->where('status', 'accepted')->exists();
        abort_unless($canView, 403, 'Bạn không có quyền xem tranh chấp này.');

        return $this->success(
            $dispute->load(['milestone.job', 'creator:id,name,role', 'votes.mentor:id,name,reputation_score']),
            'Lấy tranh chấp thành công.'
        );
    }

    public function vote(Request $request, Dispute $dispute)
    {
        abort_unless($dispute->status === 'open', 409, 'Tranh chấp đã đóng.');
        $alreadyVoted = $dispute->votes()->where('mentor_id', $request->user()->id)->exists();
        abort_unless($alreadyVoted || $dispute->votes()->count() < 3, 409, 'Tranh chấp đã đủ ba mentor chấm.');
        $data = $request->validate([
            'student_percentage' => ['required', 'integer', 'between:0,100'],
            'reason' => ['nullable', 'string', 'max:3000'],
        ]);
        $vote = DisputeVote::updateOrCreate(
            ['dispute_id' => $dispute->id, 'mentor_id' => $request->user()->id],
            $data
        );

        return $this->success($vote, 'Ghi nhận phiếu chấm thành công.');
    }

    public function resolve(Request $request, Dispute $dispute)
    {
        abort_unless($dispute->status === 'open', 409, 'Tranh chấp đã đóng.');
        abort_unless($dispute->votes()->count() >= 3, 409, 'Cần đủ ba phiếu mentor trước khi giải quyết.');
        $data = $request->validate([
            'student_percentage' => ['nullable', 'integer', 'between:0,100'],
            'resolution' => ['required', 'string', 'max:5000'],
        ]);
        $percentage = $data['student_percentage']
            ?? (int) round($dispute->votes()->avg('student_percentage') ?? 0);
        $dispute->update([
            'student_percentage' => $percentage,
            'resolution' => $data['resolution'],
            'status' => 'resolved',
            'resolved_by' => $request->user()->id,
            'resolved_at' => now(),
        ]);

        return $this->success($dispute->fresh()->load('votes'), 'Giải quyết tranh chấp thành công.');
    }
}
