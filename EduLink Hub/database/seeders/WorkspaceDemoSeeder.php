<?php

namespace Database\Seeders;

use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Database\Seeder;

class WorkspaceDemoSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(DatabaseSeeder::class);
        foreach ([2, 3] as $number) {
            User::firstOrCreate(['email' => "mentor{$number}@edulink.test"], ['name' => "Mentor {$number}", 'password' => 'Password123!', 'role' => 'mentor', 'reputation_score' => 90]);
        }
        foreach ([2, 3, 4, 5] as $number) {
            $user = User::firstOrCreate(['email' => "student{$number}@edulink.test"], ['name' => "Ứng viên {$number}", 'password' => 'Password123!', 'role' => 'student', 'reputation_score' => 40 + $number * 5]);
            StudentProfile::firstOrCreate(['user_id' => $user->id], ['skills' => ['React', 'English'], 'availability' => true, 'university' => 'Đại học Demo', 'completed_jobs' => $number - 1, 'on_time_jobs' => $number - 1]);
        }
    }
}
