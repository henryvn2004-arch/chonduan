import type { ProjectDetail } from '@/types/project'
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react'

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function ReviewSection({ project }: { project: ProjectDetail }) {
  const hasReview = project.review_count && project.review_count > 0

  return (
    <section id="review" className="scroll-mt-28">
      <h2 className="text-xl font-bold text-[#0D1B3D] mb-4">Review cư dân</h2>

      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        {hasReview ? (
          <div className="space-y-4">
            {/* Rating overview */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-[#0D1B3D]">
                  {project.review_avg_rating?.toFixed(1)}
                </div>
                <StarRating rating={project.review_avg_rating ?? 0} />
                <div className="text-xs text-[#64748B] mt-1">{project.review_count} đánh giá</div>
              </div>
            </div>

            {/* Pros/Cons */}
            <div className="grid sm:grid-cols-2 gap-4">
              {project.review_pros_summary && (
                <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex items-center gap-1 text-xs font-medium text-green-700 mb-2"><ThumbsUp className="w-3.5 h-3.5" strokeWidth={2} /> Ưu điểm nổi bật</div>
                  <p className="text-sm text-green-800">{project.review_pros_summary}</p>
                </div>
              )}
              {project.review_cons_summary && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-1 text-xs font-medium text-red-600 mb-2"><ThumbsDown className="w-3.5 h-3.5" strokeWidth={2} /> Nhược điểm cần lưu ý</div>
                  <p className="text-sm text-red-700">{project.review_cons_summary}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" strokeWidth={1.5} />
            <div className="text-sm font-medium text-[#0D1B3D] mb-1">Chưa có đánh giá</div>
            <p className="text-sm text-[#94A3B8]">Tính năng review cư dân sẽ ra mắt sớm.</p>
          </div>
        )}
      </div>
    </section>
  )
}
