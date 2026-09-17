"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Check, RotateCcw, Scale } from "lucide-react";
import {
  workspaceApi,
  type Job,
  type Milestone,
  money,
  dateLabel,
} from "@/lib/workspace";
import { safeExternalUrl, fundEscrow } from "@/lib/workspace-client.mjs";
import { useWorkspace } from "./WorkspaceShell";
import {
  Heading,
  useResource,
  useAction,
  Loading,
  LoadError,
  Alert,
  Status,
  Dialog,
  TransactionLink,
} from "./ui";
import Submissions from "./Submissions";
import s from "./Workspace.module.css";
type Operation = {
  kind: "approve" | "reject" | "dispute" | "fund" | "release";
  milestone?: Milestone;
};
export default function JobDetail({ id }: { id: string }) {
  const resource = useResource<Job>("/workspace/jobs/" + id);
  const { user, config } = useWorkspace();
  const action = useAction();
  const [operation, setOperation] = useState<Operation | null>(null);
  const [feedback, setFeedback] = useState("");
  const [evidence, setEvidence] = useState("");
  const [signature, setSignature] = useState("");
  const [formError, setFormError] = useState("");
  const open = (value: Operation) => {
    setOperation(value);
    setFeedback("");
    setEvidence("");
    setSignature(
      value.kind === "fund" ? resource.data?.escrow?.deposit_tx || "" : "",
    );
    setFormError("");
  };
  const job = resource.data;
  const mock = config.blockchain_mode === "mock";
  const employer = user.role === "employer";
  const titles = {
    approve: mock ? "Duyệt và giải ngân mô phỏng" : "Duyệt milestone",
    reject: "Yêu cầu chỉnh sửa",
    dispute: "Mở tranh chấp",
    fund: mock ? "Xác nhận ký quỹ mô phỏng" : "Xác minh giao dịch ký quỹ",
    release: mock
      ? "Xác nhận giải ngân mô phỏng"
      : "Xác minh giao dịch giải ngân",
  };
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!job || !operation) return;
    setFormError("");
    const links = evidence
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);
    if (
      operation.kind === "dispute" &&
      links.some((link) => !safeExternalUrl(link))
    ) {
      setFormError("Bằng chứng phải là đường dẫn HTTP hoặc HTTPS hợp lệ.");
      return;
    }
    if (["reject", "dispute"].includes(operation.kind) && !feedback.trim()) {
      setFormError("Vui lòng nhập lý do.");
      return;
    }
    const ok = await action.run(
      async () => {
        if (operation.kind === "fund") {
          try {
            await fundEscrow(workspaceApi, job, signature, mock);
          } finally {
            resource.reload();
          }
        } else if (operation.kind === "release") {
          if (!job.escrow) throw new Error("Chưa có escrow cho công việc này.");
          await workspaceApi("/escrows/" + job.escrow.id + "/release", {
            method: "POST",
            body: {
              milestone_id: operation.milestone?.id,
              ...(!mock ? { release_tx: signature.trim() } : {}),
            },
          });
        } else {
          const body =
            operation.kind === "dispute"
              ? { reason: feedback.trim(), evidence: links }
              : { feedback: feedback.trim() };
          await workspaceApi(
            "/milestones/" + operation.milestone?.id + "/" + operation.kind,
            { method: "POST", body },
          );
        }
      },
      operation.kind === "dispute"
        ? "Đã mở tranh chấp. Mentor có thể xem bằng chứng và bỏ phiếu."
        : operation.kind === "reject"
          ? "Đã gửi yêu cầu chỉnh sửa."
          : operation.kind === "approve" && !mock
            ? "Đã duyệt milestone. Cần giao dịch giải ngân để hoàn tất thanh toán."
            : "Đã ghi nhận thao tác. Trạng thái mới được tải từ máy chủ.",
    );
    if (ok) {
      setOperation(null);
      resource.reload();
    }
  }
  return (
    <>
      <Link
        className={s.back}
        href={"/dashboard/" + user.role + (employer ? "" : "/jobs")}
      >
        <ArrowLeft size={14} />
        Danh sách công việc
      </Link>
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <LoadError message={resource.error} retry={resource.reload} />
      ) : (
        job && (
          <>
            <Heading
              eyebrow={"Công việc #" + job.id}
              title={job.title}
              description={
                "Hạn hoàn thành " +
                dateLabel(job.deadline) +
                " · " +
                (job.employer?.name || user.name)
              }
            >
              <Status value={job.status} />
            </Heading>
            {!operation && action.feedback}
            <div className={s.grid}>
              <div>
                <section className={s.panel}>
                  <h2>Phạm vi công việc</h2>
                  <p className={s.description}>{job.description}</p>
                  <div className={s.tags}>
                    {job.required_skills?.map((skill) => (
                      <span className={s.tag} key={skill}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
                <section className={s.panel}>
                  <h2>Nghiệm thu theo milestone</h2>
                  {job.milestones.map((milestone, index) => (
                    <article className={s.item} key={milestone.id}>
                      <div className={s.milestoneTop}>
                        <div>
                          <span className={s.eyebrow}>
                            Milestone {index + 1}
                          </span>
                          <h3>{milestone.title}</h3>
                          <p className={s.muted}>
                            {money(milestone.amount)} Mock USDC · Hạn{" "}
                            {dateLabel(milestone.due_date)}
                          </p>
                        </div>
                        <Status value={milestone.status} />
                      </div>
                      {milestone.description && (
                        <p className={s.description}>{milestone.description}</p>
                      )}
                      <Submissions items={milestone.submissions || []} />
                      {milestone.release_tx && (
                        <div className={s.file}>
                          <TransactionLink signature={milestone.release_tx} />
                        </div>
                      )}
                      <div className={s.actions} style={{ marginTop: 16 }}>
                        {employer && milestone.status === "submitted" && (
                          <>
                            <button
                              className={s.button}
                              disabled={action.busy}
                              onClick={() =>
                                open({ kind: "approve", milestone })
                              }
                            >
                              <Check size={15} />
                              Duyệt milestone
                            </button>
                            <button
                              className={s.secondary}
                              disabled={action.busy}
                              onClick={() =>
                                open({ kind: "reject", milestone })
                              }
                            >
                              <RotateCcw size={14} />
                              Yêu cầu sửa
                            </button>
                          </>
                        )}
                        {employer && milestone.status === "approved" && (
                          <button
                            className={s.button}
                            disabled={action.busy}
                            onClick={() => open({ kind: "release", milestone })}
                          >
                            Xác nhận giải ngân
                          </button>
                        )}
                        {employer &&
                          ["submitted", "approved"].includes(
                            milestone.status,
                          ) && (
                            <button
                              className={s.danger}
                              disabled={action.busy}
                              onClick={() =>
                                open({ kind: "dispute", milestone })
                              }
                            >
                              <Scale size={14} />
                              Mở tranh chấp
                            </button>
                          )}
                        {milestone.disputes?.map((dispute) => (
                          <Link
                            className={s.link}
                            key={dispute.id}
                            href={
                              "/dashboard/" +
                              user.role +
                              "/disputes/" +
                              dispute.id
                            }
                          >
                            Xem tranh chấp #{dispute.id}
                          </Link>
                        ))}
                      </div>
                    </article>
                  ))}
                </section>
              </div>
              <aside>
                <section className={s.panel}>
                  <span className={s.eyebrow}>Ngân sách & ký quỹ</span>
                  <h2 style={{ fontSize: 30, margin: "10px 0" }}>
                    {money(job.budget)}{" "}
                    <small style={{ fontSize: 12, fontWeight: 400 }}>
                      Mock USDC
                    </small>
                  </h2>
                  <Status value={job.escrow?.status || "pending"} />
                  <div className={s.detailList}>
                    <div>
                      <dt>Milestone đã thanh toán</dt>
                      <dd>
                        {
                          job.milestones.filter((m) => m.status === "paid")
                            .length
                        }
                        /{job.milestones.length}
                      </dd>
                    </div>
                    <div>
                      <dt>Giao dịch ký quỹ</dt>
                      <dd>
                        <TransactionLink signature={job.escrow?.deposit_tx} />
                      </dd>
                    </div>
                  </div>
                  {mock && (
                    <p className={s.readonly}>
                      Chế độ mô phỏng: chỉ cập nhật dữ liệu demo, không chuyển
                      token trên blockchain.
                    </p>
                  )}
                  {employer && job.status === "awaiting_funding" && (
                    <>
                      <button
                        className={s.button}
                        style={{ width: "100%" }}
                        disabled={action.busy || !user.wallet_address}
                        onClick={() => open({ kind: "fund" })}
                      >
                        {job.escrow
                          ? "Kiểm tra lại ký quỹ"
                          : mock
                            ? "Ký quỹ mô phỏng"
                            : "Xác minh ký quỹ"}
                      </button>
                      {!user.wallet_address && (
                        <p className={s.muted} style={{ marginTop: 12 }}>
                          Tài khoản cần liên kết ví qua module ví trước khi ký
                          quỹ.
                        </p>
                      )}
                    </>
                  )}
                </section>
                <section className={s.panel}>
                  <div className={s.milestoneTop}>
                    <h2 style={{ margin: 0 }}>Top 5 ứng viên</h2>
                    <Sparkles size={18} color="#c59cff" />
                  </div>
                  <p className={s.muted}>
                    Điểm matching và hồ sơ do hệ thống cung cấp. Sinh viên xác
                    nhận nhận việc theo luồng hiện tại.
                  </p>
                  {employer && (
                    <button
                      className={s.secondary}
                      style={{ width: "100%", margin: "16px 0" }}
                      disabled={action.busy || job.status !== "open"}
                      onClick={async () => {
                        if (
                          await action.run(
                            () =>
                              workspaceApi("/jobs/" + job.id + "/match", {
                                method: "POST",
                              }),
                            "Đã cập nhật đề xuất Top 5.",
                          )
                        )
                          resource.reload();
                      }}
                    >
                      Đề xuất Top 5
                    </button>
                  )}
                  {(job.applications || []).length === 0 ? (
                    <p className={s.muted} style={{ marginTop: 18 }}>
                      Chưa có ứng viên. Ký quỹ và mở công việc để chạy matching.
                    </p>
                  ) : (
                    [...(job.applications || [])]
                      .sort(
                        (a, b) => Number(b.match_score) - Number(a.match_score),
                      )
                      .slice(0, 5)
                      .map((candidate) => (
                        <details className={s.candidate} key={candidate.id}>
                          <summary>
                            <span>
                              {candidate.student.name}
                              <br />
                              <Status value={candidate.status} />
                            </span>
                            <span className={s.score}>
                              {candidate.match_score === null
                                ? "—"
                                : money(candidate.match_score)}
                            </span>
                          </summary>
                          <div className={s.item}>
                            <p className={s.description}>
                              {candidate.ai_reason ||
                                "Ứng viên ứng tuyển trực tiếp."}
                            </p>
                            <div className={s.tags}>
                              {candidate.student.student_profile?.skills?.map(
                                (skill) => (
                                  <span className={s.tag} key={skill}>
                                    {skill}
                                  </span>
                                ),
                              )}
                            </div>
                            <p className={s.muted}>
                              {candidate.student.email}
                              <br />
                              {candidate.student.student_profile?.university}
                              <br />
                              Uy tín: {candidate.student.reputation_score} · Đã
                              hoàn thành:{" "}
                              {candidate.student.student_profile
                                ?.completed_jobs || 0}{" "}
                              việc
                            </p>
                            {candidate.student.student_profile?.bio && (
                              <p className={s.description}>
                                {candidate.student.student_profile.bio}
                              </p>
                            )}
                          </div>
                        </details>
                      ))
                  )}
                </section>
              </aside>
            </div>
          </>
        )
      )}
      {operation && job && (
        <Dialog
          title={titles[operation.kind]}
          busy={action.busy}
          onClose={() => setOperation(null)}
        >
          <p>
            {operation.milestone
              ? operation.milestone.title +
                " · " +
                money(operation.milestone.amount) +
                " Mock USDC"
              : money(job.budget) + " Mock USDC"}
          </p>
          {operation.kind === "approve" && (
            <Alert kind="notice">
              {mock
                ? "Duyệt sẽ ghi nhận milestone đã thanh toán trong dữ liệu mô phỏng."
                : "Duyệt chỉ xác nhận chất lượng sản phẩm. Thanh toán hoàn tất sau khi giao dịch giải ngân được xác minh."}
            </Alert>
          )}
          {operation.kind === "dispute" && (
            <p>
              Milestone sẽ chuyển sang tranh chấp và chờ ba Mentor đánh giá.
            </p>
          )}
          {action.feedback}
          {formError && <Alert>{formError}</Alert>}
          <form onSubmit={submit}>
            {["approve", "reject", "dispute"].includes(operation.kind) && (
              <div className={s.field}>
                <label htmlFor="review-feedback">
                  {operation.kind === "dispute"
                    ? "Lý do tranh chấp *"
                    : operation.kind === "reject"
                      ? "Nội dung cần chỉnh sửa *"
                      : "Phản hồi nghiệm thu"}
                </label>
                <textarea
                  id="review-feedback"
                  className={s.textarea}
                  required={operation.kind !== "approve"}
                  maxLength={5000}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>
            )}
            {operation.kind === "dispute" && (
              <div className={s.field}>
                <label htmlFor="review-evidence">Link bằng chứng</label>
                <textarea
                  id="review-evidence"
                  className={s.textarea}
                  placeholder="Mỗi đường dẫn trên một dòng"
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                />
              </div>
            )}
            {!mock &&
              (operation.kind === "release" || operation.kind === "fund") && (
                <>
                  <p>
                    Nhập chữ ký giao dịch đã thực hiện bằng module ví Solana.
                    Màn hình này xác minh giao dịch, không tự ký hoặc gửi token.
                  </p>
                  <div className={s.field}>
                    <label htmlFor="transaction-signature">
                      Chữ ký giao dịch *
                    </label>
                    <input
                      id="transaction-signature"
                      className={s.input}
                      required
                      maxLength={128}
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                    />
                  </div>
                </>
              )}
            <button
              className={operation.kind === "dispute" ? s.danger : s.button}
              disabled={action.busy}
            >
              {action.busy ? "Đang xử lý…" : "Xác nhận"}
            </button>
          </form>
        </Dialog>
      )}
    </>
  );
}
