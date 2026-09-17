"use client";
import { useEffect, useState } from "react";
import { Clock, CheckCircle, AlertCircle, Upload } from "lucide-react";
import { fetchMyJobs, type MyJob } from "@/lib/api";
import SubmitWorkModal from "@/components/student/SubmitWorkModal";
import styles from "./page.module.css";

const STATUS_CONFIG: Record<MyJob["status"], { label: string; color: string; badgeClass: string }> = {
  accepted:    { label: "Đã nhận", color: "var(--color-info)", badgeClass: "badge-blue" },
  in_progress: { label: "Đang làm", color: "var(--color-warning)", badgeClass: "badge-gold" },
  submitted:   { label: "Đã nộp", color: "var(--color-primary)", badgeClass: "badge-purple" },
  approved:    { label: "Đã duyệt", color: "var(--color-secondary)", badgeClass: "badge-green" },
  disputed:    { label: "Tranh chấp", color: "var(--color-danger)", badgeClass: "badge-red" },
};

export default function MyJobsPage() {
  const [jobs, setJobs] = useState<MyJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitModal, setSubmitModal] = useState<{ jobId: string; jobTitle: string } | null>(null);

  useEffect(() => {
    fetchMyJobs().then((data) => { setJobs(data); setIsLoading(false); });
  }, []);

  const totalEarned = jobs.filter(j => j.status === "approved").reduce((sum, j) => sum + j.budget, 0);
  const pending = jobs.filter(j => ["in_progress", "submitted"].includes(j.status)).reduce((sum, j) => sum + j.budget, 0);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Việc của tôi</h1>
          <p className={styles.subtitle}>Theo dõi tiến độ và nộp bài cho các dự án đang làm</p>
        </div>
        <div className={styles.summaryRow}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryNum} style={{ color: "var(--color-secondary)" }}>{totalEarned} USDC</span>
            <span className={styles.summaryLabel}>Đã kiếm</span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryItem}>
            <span className={styles.summaryNum} style={{ color: "var(--color-warning)" }}>{pending} USDC</span>
            <span className={styles.summaryLabel}>Đang chờ</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.skeletons}>
          {[1, 2].map(i => (
            <div key={i} className="skeleton" style={{ height: "200px", borderRadius: "var(--radius-lg)" }} />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className={styles.empty}>
          <span>💼</span>
          <h3>Chưa có việc nào</h3>
          <p>Hãy tìm và nhận việc phù hợp với kỹ năng của bạn</p>
        </div>
      ) : (
        <div className={styles.jobsList}>
          {jobs.map((job) => {
            const cfg = STATUS_CONFIG[job.status];
            const completedMilestones = job.milestones.filter(m => m.status !== "pending").length;
            const totalMilestones = job.milestones.length;
            const progressPct = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

            return (
              <div key={job.id} className={`glass-card ${styles.jobCard}`}>
                {/* Job top row */}
                <div className={styles.jobTop}>
                  <div className={styles.jobInfo}>
                    <h3 className={styles.jobTitle}>{job.title}</h3>
                    <div className={styles.jobCompany}>{job.company}</div>
                  </div>
                  <div className={styles.jobRight}>
                    <span className={`badge ${cfg.badgeClass}`}>{cfg.label}</span>
                    <div className={styles.jobBudget}>{job.budget} <span>USDC</span></div>
                  </div>
                </div>

                {/* Escrow address */}
                {job.escrowAddress && (
                  <div className={styles.escrowRow}>
                    <span className={styles.escrowLabel}>🔒 Escrow:</span>
                    <span className="mono" style={{ fontSize: "12px", color: "var(--text-muted)" }}>{job.escrowAddress}</span>
                  </div>
                )}

                {/* Progress bar */}
                <div className={styles.progressSection}>
                  <div className={styles.progressHeader}>
                    <span className={styles.progressLabel}>Tiến độ milestone</span>
                    <span className={styles.progressNum}>{completedMilestones}/{totalMilestones}</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
                  </div>
                </div>

                {/* Milestones */}
                <div className={styles.milestones}>
                  {job.milestones.map((m) => (
                    <div key={m.id} className={`${styles.milestone} ${styles[`ms_${m.status}`]}`}>
                      <div className={styles.msIcon}>
                        {m.status === "paid" ? <CheckCircle size={14} color="var(--color-secondary)" /> :
                         m.status === "completed" ? <CheckCircle size={14} color="var(--color-primary)" /> :
                         <Clock size={14} color="var(--text-muted)" />}
                      </div>
                      <div className={styles.msInfo}>
                        <div className={styles.msTitle}>{m.title}</div>
                        <div className={styles.msDate}>Hạn: {new Date(m.dueDate).toLocaleDateString("vi-VN")}</div>
                      </div>
                      <div className={styles.msAmount}>{m.amount} USDC</div>
                      {m.status === "paid" && <span className="badge badge-green">Đã trả</span>}
                      {m.status === "completed" && <span className="badge badge-purple">Chờ duyệt</span>}
                      {m.status === "pending" && <span className="badge badge-gray">Chưa xong</span>}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className={styles.jobActions}>
                  <div className={styles.deadline}>
                    <Clock size={13} />
                    Hạn: {new Date(job.deadline).toLocaleDateString("vi-VN")}
                  </div>
                  {job.status === "in_progress" && (
                    <button
                      id={`submit-${job.id}`}
                      className="btn-primary"
                      style={{ fontSize: "13px", padding: "8px 20px" }}
                      onClick={() => setSubmitModal({ jobId: job.id, jobTitle: job.title })}
                    >
                      <Upload size={14} />
                      Nộp sản phẩm
                    </button>
                  )}
                  {job.status === "submitted" && (
                    <div className={styles.submittedNote}>
                      <AlertCircle size={13} />
                      Đã nộp {job.submittedAt ? new Date(job.submittedAt).toLocaleDateString("vi-VN") : ""}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit modal */}
      {submitModal && (
        <SubmitWorkModal
          jobId={submitModal.jobId}
          jobTitle={submitModal.jobTitle}
          onClose={() => setSubmitModal(null)}
          onSuccess={() => fetchMyJobs().then(setJobs)}
        />
      )}
    </div>
  );
}
