"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, Users, Star, Shield, CheckCircle, Loader } from "lucide-react";
import { fetchJobById, applyJob, type Job } from "@/lib/api";
import styles from "./page.module.css";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJobById(params.id as string)
      .then(setJob)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Không tải được công việc."))
      .finally(() => setIsLoading(false));
  }, [params.id]);

  const handleApply = async () => {
    if (!job) return;
    setError("");
    setIsApplying(true);
    try {
      await applyJob(job.id);
      setApplied(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể nhận việc.");
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Loader size={32} className={styles.spin} />
        <p>Đang tải thông tin việc...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className={styles.notFound}>
        <h2>Không tìm thấy công việc</h2>
        <button className="btn-outline" onClick={() => router.back()}>← Quay lại</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Back */}
      <button id="back-btn" className={styles.backBtn} onClick={() => router.back()}>
        <ArrowLeft size={16} />
        Quay lại danh sách
      </button>

      {error && <div className="badge badge-red" style={{ marginBottom: "16px" }}>{error}</div>}

      <div className={styles.layout}>
        {/* ── Main content ── */}
        <div className={styles.main}>
          {/* Job header */}
          <div className={`glass-card ${styles.jobHeader}`}>
            {job.isAIRecommended && (
              <div className="badge badge-purple" style={{ marginBottom: "12px" }}>🤖 AI Gợi ý — {job.matchScore}% phù hợp</div>
            )}
            <div className={styles.companyRow}>
              <img src={job.companyLogo} alt={job.company} className={styles.companyLogo} />
              <div>
                <h1 className={styles.jobTitle}>{job.title}</h1>
                <div className={styles.jobCompany}>{job.company}</div>
              </div>
            </div>

            {/* Match bar */}
            {job.matchScore && (
              <div className={styles.matchSection}>
                <div className={styles.matchHeader}>
                  <span className={styles.matchLabel}>Độ phù hợp với hồ sơ của bạn</span>
                  <span className={styles.matchPct}>{job.matchScore}%</span>
                </div>
                <div className={styles.matchBarBig}>
                  <div className={styles.matchFillBig} style={{ width: `${job.matchScore}%` }} />
                </div>
              </div>
            )}

            {/* Meta chips */}
            <div className={styles.metaChips}>
              <div className={styles.chip}>
                <Clock size={13} color="var(--text-muted)" />
                {job.duration}
              </div>
              <div className={styles.chip}>
                <Users size={13} color="var(--text-muted)" />
                {job.applicants} ứng viên
              </div>
              <div className={styles.chip}>
                <Shield size={13} color="var(--color-secondary)" />
                Escrow USDC
              </div>
              <span className="badge badge-purple">{job.category}</span>
              <span className="badge badge-green">{job.status === "open" ? "Đang mở" : "Đã đóng"}</span>
            </div>
          </div>

          {/* Description */}
          <div className={`glass-card ${styles.descCard}`}>
            <h2 className={styles.sectionTitle}>Mô tả công việc</h2>
            <p className={styles.desc}>{job.description}</p>
          </div>

          {/* Skills required */}
          <div className={`glass-card ${styles.skillsCard}`}>
            <h2 className={styles.sectionTitle}>Kỹ năng yêu cầu</h2>
            <div className={styles.skillsList}>
              {job.skills.map((s) => (
                <span key={s} className="badge badge-gray" style={{ fontSize: "13px", padding: "6px 14px" }}>{s}</span>
              ))}
            </div>
          </div>

          {/* SBT Requirements */}
          {job.requiredSBTs.length > 0 && (
            <div className={`glass-card ${styles.sbtCard}`}>
              <h2 className={styles.sectionTitle}>
                <Star size={16} color="var(--color-accent)" /> Chứng chỉ SBT bắt buộc
              </h2>
              <p className={styles.sbtNote}>
                Doanh nghiệp yêu cầu bạn phải có các SBT sau từ Open Campus để nộp đơn:
              </p>
              {job.requiredSBTs.map((sbt) => (
                <div key={sbt} className={styles.sbtItem}>
                  <CheckCircle size={14} color="var(--color-secondary)" />
                  <span className="mono">{sbt}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className={styles.sidebar}>
          {/* Budget card */}
          <div className={`glass-card ${styles.budgetCard}`}>
            <div className={styles.budgetLabel}>Ngân sách dự án</div>
            <div className={styles.budgetNum}>{job.budget}</div>
            <div className={styles.budgetToken}>USDC</div>
            <div className="divider" style={{ margin: "16px 0" }} />
            <div className={styles.budgetInfo}>
              <div className={styles.budgetRow}>
                <span>Bạn nhận được</span>
                <span style={{ color: "var(--color-secondary)", fontWeight: 700 }}>
                  {(job.budget * 0.98).toFixed(1)} USDC
                </span>
              </div>
              <div className={styles.budgetRow}>
                <span>Phí nền tảng</span>
                <span>{(job.budget * 0.02).toFixed(1)} USDC (2%)</span>
              </div>
            </div>
            <div className="divider" style={{ margin: "16px 0" }} />
            <div className={styles.escrowNote}>
              <Shield size={14} color="var(--color-secondary)" />
              <span>{job.budget} USDC đã được khóa trong Solana Escrow</span>
            </div>
          </div>

          {/* Apply button */}
          {applied ? (
            <div className={styles.appliedBox}>
              <CheckCircle size={24} color="var(--color-secondary)" />
              <h3>Đã nộp đơn!</h3>
              <p>Doanh nghiệp sẽ xem xét hồ sơ SBT của bạn và phản hồi sớm.</p>
            </div>
          ) : (
            <button
              id="apply-btn"
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", fontSize: "15px", padding: "14px" }}
              onClick={handleApply}
              disabled={isApplying || job.status !== "open"}
            >
              {isApplying ? (
                <><Loader size={16} className={styles.spin} /> Đang xử lý...</>
              ) : (
                "🚀 Nộp đơn ứng tuyển"
              )}
            </button>
          )}

          {/* Deadline */}
          <div className={`glass-card ${styles.deadlineCard}`}>
            <div className={styles.deadlineLabel}>Hạn nộp</div>
            <div className={styles.deadlineDate}>
              {new Date(job.deadline).toLocaleDateString("vi-VN", {
                weekday: "long", day: "numeric", month: "long", year: "numeric"
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
