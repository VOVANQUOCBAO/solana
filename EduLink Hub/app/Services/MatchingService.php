<?php

namespace App\Services;

use App\Models\Job;
use App\Models\User;
use Illuminate\Support\Collection;

class MatchingService
{
    public function topCandidates(Job $job, int $limit = 5): Collection
    {
        return User::query()
            ->where('role', 'student')
            ->whereHas('studentProfile', fn ($query) => $query->where('availability', true))
            ->with('studentProfile')
            ->get()
            ->map(fn (User $student) => $this->score($job, $student))
            ->sortByDesc('match_score')
            ->take($limit)
            ->values();
    }

    public function score(Job $job, User $student): array
    {
        $profile = $student->studentProfile;
        $required = collect($job->required_skills ?? [])->map(fn ($skill) => mb_strtolower(trim($skill)))->filter();
        $skills = collect($profile?->skills ?? [])->map(fn ($skill) => mb_strtolower(trim($skill)))->filter();
        $matched = $required->intersect($skills)->values();

        $skillScore = $required->isEmpty() ? 40 : 40 * ($matched->count() / $required->count());
        $certificateScore = empty($profile?->sbt_data) ? 0 : 20;
        $reputationScore = 20 * min(max($student->reputation_score, 0), 100) / 100;
        $experienceScore = 15 * min(($profile?->completed_jobs ?? 0) / 5, 1);
        $onTimeRate = ($profile?->completed_jobs ?? 0) > 0
            ? ($profile->on_time_jobs / $profile->completed_jobs)
            : 0;
        $onTimeScore = 5 * min($onTimeRate, 1);
        $score = round($skillScore + $certificateScore + $reputationScore + $experienceScore + $onTimeScore, 2);

        $reason = $matched->isNotEmpty()
            ? 'Phù hợp kỹ năng: '.$matched->join(', ').'; điểm uy tín '.$student->reputation_score.'.'
            : 'Chưa trùng kỹ năng bắt buộc; điểm uy tín '.$student->reputation_score.'.';

        return ['student_id' => $student->id, 'match_score' => $score, 'reason' => $reason];
    }
}
