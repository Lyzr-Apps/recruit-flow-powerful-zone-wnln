'use client'

import React, { useState, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  FiHome, FiSearch, FiBarChart2, FiCheckSquare, FiCalendar,
  FiFileText, FiDollarSign, FiChevronRight, FiChevronDown,
  FiLoader, FiPlus, FiMail, FiClock, FiMapPin,
  FiBriefcase, FiAward, FiTrendingUp, FiUsers,
  FiCheck, FiX, FiDownload, FiExternalLink, FiAlertCircle,
  FiMessageSquare, FiTarget, FiActivity, FiZap
} from 'react-icons/fi'

// ──────────────────────────────────────────────
// AGENT IDS
// ──────────────────────────────────────────────
const AGENTS = {
  sourcing: '699da45bc9d1ec5e717898a1',
  matching: '699da45b25bfd8a7382bdfa2',
  evaluation: '699da45b7c54a9ee105c16e0',
  scheduler: '699da4797c54a9ee105c16e6',
  analysis: '699da489c9d1ec5e717898ad',
  negotiation: '699da45d4d9b8b973a73e3eb',
  offer: '699da45d981cd5ea8d6e133d',
} as const

const AGENT_INFO = [
  { id: AGENTS.sourcing, name: 'Candidate Sourcing', purpose: 'Searches web for candidates', icon: FiSearch },
  { id: AGENTS.matching, name: 'Candidate Matching', purpose: 'Ranks & scores candidates', icon: FiBarChart2 },
  { id: AGENTS.evaluation, name: 'Candidate Evaluation', purpose: 'Screening assessments', icon: FiCheckSquare },
  { id: AGENTS.scheduler, name: 'Interview Scheduler', purpose: 'Calendar & email automation', icon: FiCalendar },
  { id: AGENTS.analysis, name: 'Interview Analysis', purpose: 'Evaluates interview performance', icon: FiFileText },
  { id: AGENTS.negotiation, name: 'Compensation Negotiation', purpose: 'Market comp analysis', icon: FiDollarSign },
  { id: AGENTS.offer, name: 'Offer Letter Drafting', purpose: 'Generates offer documents', icon: FiFileText },
]

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────
interface Candidate {
  name: string
  current_title: string
  company: string
  location: string
  years_of_experience: string
  key_skills: string[]
  relevance_score: string
  relevance_notes: string
  contact_info: string
  source_platform: string
}

interface RankedCandidate {
  rank: string
  name: string
  overall_score: string
  skills_match: string
  experience_match: string
  cultural_fit: string
  scoring_reasoning: string
  strengths: string[]
  concerns: string[]
}

interface AssessmentQuestion {
  question_number: string
  category: string
  question: string
  expected_answer_guidance: string
}

interface EvaluationData {
  technical_score: string
  problem_solving_score: string
  communication_score: string
  overall_score: string
  recommendation: string
  confidence_level: string
  summary: string
  strengths: string[]
  areas_of_concern: string[]
}

interface EvalResult {
  candidate_name: string
  assessment_questions: AssessmentQuestion[]
  evaluation: EvaluationData | null
}

interface ScheduledInterview {
  candidate_name: string
  interviewer_email: string
  date: string
  time: string
  duration: string
  meeting_link: string
  calendar_event_id: string
  status: string
}

interface EmailSent {
  recipient: string
  subject: string
  status: string
}

interface SchedulingResult {
  scheduling_status: string
  scheduled_interviews: ScheduledInterview[]
  emails_sent: EmailSent[]
  summary: string
}

interface CompetencyScore {
  dimension: string
  score: string
  justification: string
}

interface AnalysisResult {
  candidate_name: string
  competency_scores: CompetencyScore[]
  overall_score: string
  recommendation: string
  confidence_percentage: string
  strengths: string[]
  concerns: string[]
  notable_quotes: string[]
  summary: string
}

interface MarketAnalysis {
  role: string
  location: string
  market_median: string
  market_range_low: string
  market_range_high: string
  data_sources: string[]
}

interface RecommendedOffer {
  base_salary: string
  bonus: string
  equity: string
  total_compensation: string
  reasoning: string
}

interface CounterOfferScenario {
  scenario: string
  response: string
  adjusted_offer: string
}

interface NegotiationResult {
  market_analysis: MarketAnalysis | null
  recommended_offer: RecommendedOffer | null
  talking_points: string[]
  counter_offer_scenarios: CounterOfferScenario[]
  negotiation_summary: string
}

interface OfferMetadata {
  candidate_name: string
  position: string
  department: string
  start_date: string
  total_compensation: string
  acceptance_deadline: string
}

interface OfferResult {
  letter_content: string
  metadata: OfferMetadata | null
  compliance_notes: string[]
  artifact_files: { file_url: string }[]
}

interface JobDescription {
  title: string
  department: string
  requirements: string
  skills: string
  experienceMin: string
  experienceMax: string
  location: string
  salaryMin: string
  salaryMax: string
}

type ScreenId = 'dashboard' | 'sourcing' | 'matching' | 'evaluation' | 'scheduling' | 'analysis' | 'offers'

// ──────────────────────────────────────────────
// SAMPLE DATA
// ──────────────────────────────────────────────
const SAMPLE_JOB: JobDescription = {
  title: 'Senior Full-Stack Engineer',
  department: 'Engineering',
  requirements: 'Build and maintain scalable web applications using React, Node.js, and cloud technologies. Lead feature development, conduct code reviews, and mentor junior developers. Experience with microservices architecture and CI/CD pipelines required. Familiarity with Indian fintech or e-commerce platforms is a plus.',
  skills: 'React, Node.js, TypeScript, AWS, PostgreSQL, Docker, GraphQL, Kafka',
  experienceMin: '5',
  experienceMax: '10',
  location: 'Bangalore, India',
  salaryMin: '2500000',
  salaryMax: '4500000',
}

const SAMPLE_CANDIDATES: Candidate[] = [
  { name: 'Arun Kumar Sharma', current_title: 'Senior Software Engineer', company: 'Razorpay', location: 'Bangalore, India', years_of_experience: '7', key_skills: ['React', 'TypeScript', 'Node.js', 'AWS', 'PostgreSQL', 'Kafka'], relevance_score: '93', relevance_notes: 'Strong full-stack background with fintech experience at Razorpay. Led payments team of 6 engineers. IIT Bombay alumnus.', contact_info: 'arun.sharma@email.com', source_platform: 'Naukri' },
  { name: 'Priya Venkatesh', current_title: 'Staff Engineer', company: 'Flipkart', location: 'Bangalore, India', years_of_experience: '9', key_skills: ['React', 'GraphQL', 'Docker', 'Kubernetes', 'Java', 'Node.js'], relevance_score: '90', relevance_notes: 'Extensive experience in scalable e-commerce architectures at Flipkart. Built services handling 10M+ requests/day. NIT Trichy alumna.', contact_info: 'priya.v@email.com', source_platform: 'LinkedIn' },
  { name: 'Rahul Mehta', current_title: 'Full-Stack Developer', company: 'Swiggy', location: 'Bangalore, India', years_of_experience: '6', key_skills: ['React', 'Node.js', 'TypeScript', 'GraphQL', 'MongoDB', 'Redis'], relevance_score: '87', relevance_notes: 'Strong product engineering skills at Swiggy. Built real-time order tracking systems. BITS Pilani graduate.', contact_info: 'rahul.mehta@email.com', source_platform: 'Instahyre' },
  { name: 'Deepika Nair', current_title: 'SDE-3', company: 'Amazon India', location: 'Bangalore, India', years_of_experience: '5', key_skills: ['React', 'Java', 'TypeScript', 'AWS', 'PostgreSQL', 'DynamoDB'], relevance_score: '82', relevance_notes: 'Strong technical foundation from Amazon India. System design expertise. IIIT Hyderabad alumna. Less Node.js experience.', contact_info: 'deepika.n@email.com', source_platform: 'LinkedIn' },
  { name: 'Vikram Reddy', current_title: 'Lead Developer', company: 'Zerodha', location: 'Bangalore, India', years_of_experience: '8', key_skills: ['React', 'Node.js', 'AWS', 'Docker', 'Go', 'Redis'], relevance_score: '91', relevance_notes: 'Startup leadership at Zerodha. Built low-latency trading platforms from scratch. IIT Kharagpur alumnus. Strong system design.', contact_info: 'vikram.r@email.com', source_platform: 'Cutshort' },
]

const SAMPLE_RANKED: RankedCandidate[] = [
  { rank: '1', name: 'Arun Kumar Sharma', overall_score: '93', skills_match: '95', experience_match: '91', cultural_fit: '90', scoring_reasoning: 'Strongest technical match with comprehensive full-stack skills. Razorpay fintech experience aligns perfectly. IIT Bombay pedigree. Bangalore-based, no relocation needed.', strengths: ['Perfect tech stack alignment', 'Fintech domain expertise at Razorpay', 'IIT Bombay alumnus', 'Bangalore native'], concerns: ['May expect 40+ LPA CTC given Razorpay background'] },
  { rank: '2', name: 'Vikram Reddy', overall_score: '91', skills_match: '88', experience_match: '93', cultural_fit: '92', scoring_reasoning: 'Exceptional startup leadership at Zerodha building low-latency systems. Strong cultural alignment for innovation-driven teams. IIT Kharagpur background.', strengths: ['Startup leadership at Zerodha', 'System design expertise', 'Full ownership mentality', 'Go + Node.js dual proficiency'], concerns: ['Zerodha is a flat org - may need adjustment to hierarchical structure'] },
  { rank: '3', name: 'Priya Venkatesh', overall_score: '90', skills_match: '85', experience_match: '94', cultural_fit: '87', scoring_reasoning: 'Most experienced candidate with deep e-commerce architecture skills at Flipkart scale. 10M+ requests/day experience is rare.', strengths: ['Flipkart-scale architecture experience', 'Senior mentoring track record', 'Kubernetes expertise at scale'], concerns: ['Primarily Java background, Node.js is secondary', 'May expect Staff-level CTC of 45+ LPA'] },
]

// ──────────────────────────────────────────────
// UTILITIES
// ──────────────────────────────────────────────
function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

function parseNum(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0
  const n = typeof val === 'number' ? val : parseFloat(String(val))
  return isNaN(n) ? 0 : n
}

function scoreColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

function scoreBadgeClasses(score: number): string {
  if (score >= 80) return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  if (score >= 60) return 'bg-amber-100 text-amber-800 border-amber-200'
  return 'bg-red-100 text-red-800 border-red-200'
}

function safeParseData(data: unknown): Record<string, unknown> {
  if (!data) return {}
  if (typeof data === 'string') {
    try { return JSON.parse(data) } catch { return {} }
  }
  if (typeof data === 'object') return data as Record<string, unknown>
  return {}
}

// ──────────────────────────────────────────────
// ERROR BOUNDARY
// ──────────────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ──────────────────────────────────────────────
// NAV ITEMS
// ──────────────────────────────────────────────
const NAV_ITEMS: { id: ScreenId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: FiHome },
  { id: 'sourcing', label: 'Sourcing', icon: FiSearch },
  { id: 'matching', label: 'Matching', icon: FiBarChart2 },
  { id: 'evaluation', label: 'Evaluation', icon: FiCheckSquare },
  { id: 'scheduling', label: 'Scheduling', icon: FiCalendar },
  { id: 'analysis', label: 'Analysis', icon: FiFileText },
  { id: 'offers', label: 'Offers', icon: FiDollarSign },
]

const STAGE_ORDER: ScreenId[] = ['dashboard', 'sourcing', 'matching', 'evaluation', 'scheduling', 'analysis', 'offers']

// ──────────────────────────────────────────────
// INLINE COMPONENTS
// ──────────────────────────────────────────────

function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white/75 backdrop-blur-[16px] border border-white/20 rounded-[0.875rem] shadow-md', className)}>
      {children}
    </div>
  )
}

function ScoreBadge({ score, large }: { score: number; large?: boolean }) {
  return (
    <span className={cn('inline-flex items-center justify-center font-semibold border rounded-full', scoreBadgeClasses(score), large ? 'text-lg px-4 py-1.5' : 'text-xs px-2.5 py-0.5')}>
      {score}
    </span>
  )
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, value)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', scoreColor(value))} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function StatusMsg({ message, type }: { message: string; type: 'success' | 'error' | 'info' }) {
  if (!message) return null
  const cls = type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-blue-50 text-blue-800 border-blue-200'
  const Icon = type === 'success' ? FiCheck : type === 'error' ? FiAlertCircle : FiActivity
  return (
    <div className={cn('flex items-center gap-2 px-4 py-2.5 rounded-[0.875rem] border text-sm', cls)}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

function LoadingOverlay({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-muted border-t-primary animate-spin" />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
    </div>
  )
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
  )
}

function SkillTag({ skill }: { skill: string }) {
  return <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">{skill}</span>
}

// ──────────────────────────────────────────────
// MAIN PAGE
// ──────────────────────────────────────────────
export default function Page() {
  // ── Screen state ──
  const [activeScreen, setActiveScreen] = useState<ScreenId>('dashboard')
  const [completedStages, setCompletedStages] = useState<ScreenId[]>([])
  const [sampleMode, setSampleMode] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // ── Job state ──
  const [jobDescription, setJobDescription] = useState<JobDescription>({ title: '', department: '', requirements: '', skills: '', experienceMin: '', experienceMax: '', location: '', salaryMin: '', salaryMax: '' })

  // ── Pipeline data ──
  const [sourcedCandidates, setSourcedCandidates] = useState<Candidate[]>([])
  const [searchSummary, setSearchSummary] = useState('')
  const [totalFound, setTotalFound] = useState('')
  const [selectedForMatching, setSelectedForMatching] = useState<string[]>([])
  const [matchedCandidates, setMatchedCandidates] = useState<RankedCandidate[]>([])
  const [matchingSummary, setMatchingSummary] = useState('')
  const [selectedForScreening, setSelectedForScreening] = useState<string[]>([])
  const [evaluationResults, setEvaluationResults] = useState<Record<string, EvalResult>>({})
  const [selectedForInterview, setSelectedForInterview] = useState<string[]>([])
  const [schedulingResults, setSchedulingResults] = useState<Record<string, SchedulingResult>>({})
  const [analysisResults, setAnalysisResults] = useState<Record<string, AnalysisResult>>({})
  const [negotiationResult, setNegotiationResult] = useState<NegotiationResult | null>(null)
  const [offerResult, setOfferResult] = useState<OfferResult | null>(null)

  // ── Loading states ──
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [statusMessages, setStatusMessages] = useState<Record<string, { message: string; type: 'success' | 'error' | 'info' }>>({})

  // ── UI state ──
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null)
  const [expandedRanked, setExpandedRanked] = useState<string | null>(null)
  const [activeEvalCandidate, setActiveEvalCandidate] = useState<string | null>(null)
  const [evalAnswers, setEvalAnswers] = useState<Record<string, string>>({})
  const [activeAnalysisCandidate, setActiveAnalysisCandidate] = useState<string | null>(null)
  const [transcriptInput, setTranscriptInput] = useState('')
  const [activeSchedCandidate, setActiveSchedCandidate] = useState<string | null>(null)

  // ── Scheduling form ──
  const [schedForm, setSchedForm] = useState({ candidateEmail: '', dateStart: '', dateEnd: '', timeStart: '09:00', timeEnd: '17:00', duration: '60', interviewType: 'Technical' })
  const [interviewerEmails, setInterviewerEmails] = useState<string[]>([''])
  const [newInterviewerEmail, setNewInterviewerEmail] = useState('')

  // ── Negotiation form ──
  const [negForm, setNegForm] = useState({ budgetMin: '', budgetMax: '', candidateExpected: '', benefits: '', equity: '' })

  // ── Offer form ──
  const [offerForm, setOfferForm] = useState({ candidateName: '', position: '', department: '', startDate: '', acceptanceDeadline: '' })

  // ── Helpers ──
  const setLoading = useCallback((key: string, val: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: val }))
  }, [])

  const setStatus = useCallback((key: string, message: string, type: 'success' | 'error' | 'info') => {
    setStatusMessages(prev => ({ ...prev, [key]: { message, type } }))
  }, [])

  const clearStatus = useCallback((key: string) => {
    setStatusMessages(prev => { const n = { ...prev }; delete n[key]; return n })
  }, [])

  const markStageComplete = useCallback((stage: ScreenId) => {
    setCompletedStages(prev => prev.includes(stage) ? prev : [...prev, stage])
  }, [])

  const effectiveJob = sampleMode && !jobDescription.title ? SAMPLE_JOB : jobDescription
  const effectiveCandidates = sampleMode && sourcedCandidates.length === 0 ? SAMPLE_CANDIDATES : sourcedCandidates
  const effectiveRanked = sampleMode && matchedCandidates.length === 0 ? SAMPLE_RANKED : matchedCandidates

  // ──────────────────────────────────────────
  // AGENT CALLS
  // ──────────────────────────────────────────

  const handleSourceCandidates = async () => {
    const job = effectiveJob
    if (!job.title) { setStatus('sourcing', 'Please enter a job title', 'error'); return }
    setLoading('sourcing', true)
    clearStatus('sourcing')
    setActiveAgentId(AGENTS.sourcing)

    const message = `Find candidates for: ${job.title} at ${job.department || 'our company'}. Requirements: ${job.requirements}. Key skills: ${job.skills}. Experience: ${job.experienceMin}-${job.experienceMax} years. Location: ${job.location || 'Bangalore, India'}. CTC budget range: INR ${job.salaryMin}-${job.salaryMax} per annum.`

    const result = await callAIAgent(message, AGENTS.sourcing)
    setActiveAgentId(null)
    setLoading('sourcing', false)

    if (result.success) {
      const data = safeParseData(result?.response?.result)
      const candidates = Array.isArray(data?.candidates) ? data.candidates as Candidate[] : []
      setSourcedCandidates(candidates)
      setSearchSummary(String(data?.search_summary ?? ''))
      setTotalFound(String(data?.total_found ?? ''))
      markStageComplete('dashboard')
      setActiveScreen('sourcing')
      setStatus('sourcing', `Found ${candidates.length} candidates`, 'success')
    } else {
      setStatus('sourcing', result?.error ?? 'Failed to source candidates', 'error')
    }
  }

  const handleMatchCandidates = async () => {
    if (selectedForMatching.length === 0) { setStatus('matching', 'Select candidates to match', 'error'); return }
    setLoading('matching', true)
    clearStatus('matching')
    setActiveAgentId(AGENTS.matching)

    const selected = effectiveCandidates.filter(c => selectedForMatching.includes(c.name))
    const job = effectiveJob
    const message = `Match and rank these candidates for the ${job.title} role based in ${job.location || 'Bangalore, India'}. Job requirements: ${job.requirements}. Skills needed: ${job.skills}. Experience: ${job.experienceMin}-${job.experienceMax} years. Consider Indian tech market factors: product vs service company experience, IIT/NIT/BITS educational pedigree, and Bangalore ecosystem fit.\n\nCandidates:\n${selected.map(c => `- ${c.name}: ${c.current_title} at ${c.company}, ${c.location}, ${c.years_of_experience} years experience, skills: ${Array.isArray(c.key_skills) ? c.key_skills.join(', ') : ''}`).join('\n')}`

    const result = await callAIAgent(message, AGENTS.matching)
    setActiveAgentId(null)
    setLoading('matching', false)

    if (result.success) {
      const data = safeParseData(result?.response?.result)
      const ranked = Array.isArray(data?.ranked_candidates) ? data.ranked_candidates as RankedCandidate[] : []
      setMatchedCandidates(ranked)
      setMatchingSummary(String(data?.matching_summary ?? ''))
      markStageComplete('sourcing')
      setActiveScreen('matching')
      setStatus('matching', `Ranked ${ranked.length} candidates`, 'success')
    } else {
      setStatus('matching', result?.error ?? 'Failed to match candidates', 'error')
    }
  }

  const handleEvaluateCandidate = async (candidateName: string) => {
    setLoading(`eval-${candidateName}`, true)
    clearStatus('evaluation')
    setActiveAgentId(AGENTS.evaluation)
    setActiveEvalCandidate(candidateName)

    const job = effectiveJob
    const candidateInfo = effectiveCandidates.find(c => c.name === candidateName)
    const message = `Generate screening assessment questions for ${candidateName} applying for ${job.title} at our ${job.location || 'Bangalore, India'} office. ${candidateInfo ? `Current role: ${candidateInfo.current_title} at ${candidateInfo.company} (${candidateInfo.location}). Skills: ${Array.isArray(candidateInfo.key_skills) ? candidateInfo.key_skills.join(', ') : ''}. Experience: ${candidateInfo.years_of_experience} years.` : ''} Job requirements: ${job.requirements}. Required skills: ${job.skills}.`

    const result = await callAIAgent(message, AGENTS.evaluation)
    setActiveAgentId(null)
    setLoading(`eval-${candidateName}`, false)

    if (result.success) {
      const data = safeParseData(result?.response?.result)
      const evalData: EvalResult = {
        candidate_name: String(data?.candidate_name ?? candidateName),
        assessment_questions: Array.isArray(data?.assessment_questions) ? data.assessment_questions as AssessmentQuestion[] : [],
        evaluation: data?.evaluation ? data.evaluation as EvaluationData : null,
      }
      setEvaluationResults(prev => ({ ...prev, [candidateName]: evalData }))
      markStageComplete('matching')
      setStatus('evaluation', `Assessment generated for ${candidateName}`, 'success')
    } else {
      setStatus('evaluation', result?.error ?? 'Failed to evaluate candidate', 'error')
    }
  }

  const handleSubmitEvalAnswers = async (candidateName: string) => {
    setLoading(`eval-${candidateName}`, true)
    clearStatus('evaluation')
    setActiveAgentId(AGENTS.evaluation)

    const evalData = evaluationResults[candidateName]
    const questions = Array.isArray(evalData?.assessment_questions) ? evalData.assessment_questions : []
    const job = effectiveJob

    const answersText = questions.map((q, i) => `Q${i + 1} (${q.category}): ${q.question}\nAnswer: ${evalAnswers[`${candidateName}-${i}`] ?? 'No answer provided'}`).join('\n\n')

    const message = `Evaluate ${candidateName} for ${job.title} based on their screening answers:\n\n${answersText}\n\nPlease provide scores for technical, problem-solving, and communication skills, along with an overall recommendation.`

    const result = await callAIAgent(message, AGENTS.evaluation)
    setActiveAgentId(null)
    setLoading(`eval-${candidateName}`, false)

    if (result.success) {
      const data = safeParseData(result?.response?.result)
      const evalResult: EvalResult = {
        candidate_name: String(data?.candidate_name ?? candidateName),
        assessment_questions: Array.isArray(data?.assessment_questions) ? data.assessment_questions as AssessmentQuestion[] : questions,
        evaluation: data?.evaluation ? data.evaluation as EvaluationData : null,
      }
      setEvaluationResults(prev => ({ ...prev, [candidateName]: evalResult }))
      markStageComplete('evaluation')
      setStatus('evaluation', `Evaluation complete for ${candidateName}`, 'success')
    } else {
      setStatus('evaluation', result?.error ?? 'Failed to evaluate answers', 'error')
    }
  }

  // Auto-populate candidate email when switching candidates in scheduling
  const getSchedCandidateEmail = (name: string): string => {
    if (schedForm.candidateEmail) return schedForm.candidateEmail
    const candidate = effectiveCandidates.find(c => c.name === name)
    return candidate?.contact_info ?? ''
  }

  const validInterviewerEmails = interviewerEmails.filter(e => e.trim() !== '')

  const handleAddInterviewerEmail = () => {
    if (newInterviewerEmail.trim() && !interviewerEmails.includes(newInterviewerEmail.trim())) {
      setInterviewerEmails(prev => [...prev.filter(e => e.trim() !== ''), newInterviewerEmail.trim()])
      setNewInterviewerEmail('')
    }
  }

  const handleRemoveInterviewerEmail = (email: string) => {
    setInterviewerEmails(prev => {
      const filtered = prev.filter(e => e !== email)
      return filtered.length === 0 ? [''] : filtered
    })
  }

  const handleScheduleInterview = async (candidateName: string) => {
    const candEmail = getSchedCandidateEmail(candidateName)
    // Include any email currently being typed in the input
    const allEmails = [...validInterviewerEmails]
    if (newInterviewerEmail.trim() && !allEmails.includes(newInterviewerEmail.trim())) {
      allEmails.push(newInterviewerEmail.trim())
      setInterviewerEmails(allEmails)
      setNewInterviewerEmail('')
    }
    if (allEmails.length === 0) { setStatus('scheduling', 'Please add at least one interviewer email', 'error'); return }
    if (!candEmail) { setStatus('scheduling', 'Please enter the candidate email', 'error'); return }
    setLoading(`sched-${candidateName}`, true)
    clearStatus('scheduling')
    setActiveAgentId(AGENTS.scheduler)

    const message = `Schedule a ${schedForm.interviewType} interview for candidate ${candidateName}. Interviewer email(s): ${allEmails.join(', ')}. Candidate email: ${candEmail}. Preferred date range: ${schedForm.dateStart} to ${schedForm.dateEnd}. Time window: ${schedForm.timeStart} to ${schedForm.timeEnd}. Duration: ${schedForm.duration} minutes. Interview type: ${schedForm.interviewType}.`

    const result = await callAIAgent(message, AGENTS.scheduler)
    setActiveAgentId(null)
    setLoading(`sched-${candidateName}`, false)

    if (result.success) {
      const data = safeParseData(result?.response?.result)
      const schedResult: SchedulingResult = {
        scheduling_status: String(data?.scheduling_status ?? ''),
        scheduled_interviews: Array.isArray(data?.scheduled_interviews) ? data.scheduled_interviews as ScheduledInterview[] : [],
        emails_sent: Array.isArray(data?.emails_sent) ? data.emails_sent as EmailSent[] : [],
        summary: String(data?.summary ?? ''),
      }
      setSchedulingResults(prev => ({ ...prev, [candidateName]: schedResult }))
      markStageComplete('scheduling')
      setStatus('scheduling', `Interview scheduled for ${candidateName}`, 'success')
    } else {
      setStatus('scheduling', result?.error ?? 'Failed to schedule interview', 'error')
    }
  }

  const handleAnalyzeInterview = async (candidateName: string) => {
    if (!transcriptInput.trim()) { setStatus('analysis', 'Please paste interview transcript or notes', 'error'); return }
    setLoading(`analysis-${candidateName}`, true)
    clearStatus('analysis')
    setActiveAgentId(AGENTS.analysis)

    const message = `Analyze interview transcript for ${candidateName} applying for ${effectiveJob.title}:\n\n${transcriptInput}`

    const result = await callAIAgent(message, AGENTS.analysis)
    setActiveAgentId(null)
    setLoading(`analysis-${candidateName}`, false)

    if (result.success) {
      const data = safeParseData(result?.response?.result)
      const analysisData: AnalysisResult = {
        candidate_name: String(data?.candidate_name ?? candidateName),
        competency_scores: Array.isArray(data?.competency_scores) ? data.competency_scores as CompetencyScore[] : [],
        overall_score: String(data?.overall_score ?? ''),
        recommendation: String(data?.recommendation ?? ''),
        confidence_percentage: String(data?.confidence_percentage ?? ''),
        strengths: Array.isArray(data?.strengths) ? data.strengths as string[] : [],
        concerns: Array.isArray(data?.concerns) ? data.concerns as string[] : [],
        notable_quotes: Array.isArray(data?.notable_quotes) ? data.notable_quotes as string[] : [],
        summary: String(data?.summary ?? ''),
      }
      setAnalysisResults(prev => ({ ...prev, [candidateName]: analysisData }))
      markStageComplete('analysis')
      setStatus('analysis', `Analysis complete for ${candidateName}`, 'success')
    } else {
      setStatus('analysis', result?.error ?? 'Failed to analyze interview', 'error')
    }
  }

  const handleNegotiation = async () => {
    if (!negForm.budgetMin || !negForm.budgetMax) { setStatus('negotiation', 'Please enter budget range', 'error'); return }
    setLoading('negotiation', true)
    clearStatus('negotiation')
    setActiveAgentId(AGENTS.negotiation)

    const job = effectiveJob
    const message = `Analyze compensation for ${job.title} role in ${job.location || 'Bangalore, India'}. Company CTC budget: INR ${negForm.budgetMin}-${negForm.budgetMax} per annum. Candidate's expected CTC: INR ${negForm.candidateExpected || 'not specified'} per annum. Benefits to include: ${negForm.benefits || 'standard Indian package (PF, gratuity, medical insurance)'}. Equity/ESOPs: ${negForm.equity || 'negotiable'}.`

    const result = await callAIAgent(message, AGENTS.negotiation)
    setActiveAgentId(null)
    setLoading('negotiation', false)

    if (result.success) {
      const data = safeParseData(result?.response?.result)
      const negData: NegotiationResult = {
        market_analysis: data?.market_analysis ? data.market_analysis as MarketAnalysis : null,
        recommended_offer: data?.recommended_offer ? data.recommended_offer as RecommendedOffer : null,
        talking_points: Array.isArray(data?.talking_points) ? data.talking_points as string[] : [],
        counter_offer_scenarios: Array.isArray(data?.counter_offer_scenarios) ? data.counter_offer_scenarios as CounterOfferScenario[] : [],
        negotiation_summary: String(data?.negotiation_summary ?? ''),
      }
      setNegotiationResult(negData)
      setStatus('negotiation', 'Compensation analysis complete', 'success')
    } else {
      setStatus('negotiation', result?.error ?? 'Failed to analyze compensation', 'error')
    }
  }

  const handleDraftOffer = async () => {
    if (!offerForm.candidateName || !offerForm.position) { setStatus('offer', 'Please fill in candidate details', 'error'); return }
    setLoading('offer', true)
    clearStatus('offer')
    setActiveAgentId(AGENTS.offer)

    const compInfo = negotiationResult?.recommended_offer
    const message = `Draft an offer letter for ${offerForm.candidateName} for the position of ${offerForm.position} in the ${offerForm.department || 'Engineering'} department at our Bangalore office. Joining date: ${offerForm.startDate || 'TBD'}. Acceptance deadline: ${offerForm.acceptanceDeadline || '2 weeks from offer date'}. CTC Breakdown: Fixed Pay: ${compInfo?.base_salary ?? 'as per market rate'}, Variable Pay/Bonus: ${compInfo?.bonus ?? 'standard'}, ESOPs: ${compInfo?.equity ?? 'as applicable'}, Total CTC: ${compInfo?.total_compensation ?? 'competitive'}. Include standard Indian benefits: PF (12% employer contribution), Gratuity, Medical Insurance (family floater), Leave Encashment. Probation period: 6 months. Notice period: 2 months. Location: Bangalore, Karnataka, India.`

    const result = await callAIAgent(message, AGENTS.offer)
    setActiveAgentId(null)
    setLoading('offer', false)

    if (result.success) {
      const data = safeParseData(result?.response?.result)
      const files = Array.isArray(result?.module_outputs?.artifact_files) ? result.module_outputs!.artifact_files : []
      const offerData: OfferResult = {
        letter_content: String(data?.letter_content ?? ''),
        metadata: data?.metadata ? data.metadata as OfferMetadata : null,
        compliance_notes: Array.isArray(data?.compliance_notes) ? data.compliance_notes as string[] : [],
        artifact_files: files.map((f: Record<string, unknown>) => ({ file_url: String((f as Record<string, unknown>)?.file_url ?? '') })),
      }
      setOfferResult(offerData)
      markStageComplete('offers')
      setStatus('offer', 'Offer letter drafted successfully', 'success')
    } else {
      setStatus('offer', result?.error ?? 'Failed to draft offer letter', 'error')
    }
  }

  // ──────────────────────────────────────────
  // SCREEN TITLES
  // ──────────────────────────────────────────
  const screenTitles: Record<ScreenId, string> = {
    dashboard: 'Dashboard & Job Setup',
    sourcing: 'Candidate Sourcing',
    matching: 'Candidate Matching & Ranking',
    evaluation: 'Candidate Evaluation',
    scheduling: 'Interview Scheduling',
    analysis: 'Interview Analysis',
    offers: 'Offers & Negotiation',
  }

  // ──────────────────────────────────────────
  // DERIVED VALUES for scheduling/analysis screens
  // ──────────────────────────────────────────
  const schedCandidateNames = selectedForInterview.length > 0 ? selectedForInterview : (sampleMode ? SAMPLE_RANKED.map(c => c.name) : [])
  const effectiveSchedCandidate = activeSchedCandidate || (schedCandidateNames.length > 0 ? schedCandidateNames[0] : '')
  const analysisCandidateNames = selectedForInterview.length > 0 ? selectedForInterview : (sampleMode ? SAMPLE_RANKED.map(c => c.name) : [])
  const effectiveAnalysisCandidate = activeAnalysisCandidate || (analysisCandidateNames.length > 0 ? analysisCandidateNames[0] : '')
  const evalCandidateNames = selectedForScreening.length > 0 ? selectedForScreening : (sampleMode ? SAMPLE_RANKED.map(c => c.name) : [])
  const effectiveEvalCandidate = activeEvalCandidate || (evalCandidateNames.length > 0 ? evalCandidateNames[0] : '')

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-[hsl(160,40%,94%)] via-[hsl(180,35%,93%)] to-[hsl(140,40%,94%)] text-foreground font-sans flex">
        {/* ── SIDEBAR ── */}
        <div className="w-64 flex-shrink-0 h-screen sticky top-0 bg-[hsl(160,35%,97%)]/80 backdrop-blur-[16px] border-r border-white/20 flex flex-col">
          <div className="p-5 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[0.875rem] bg-primary flex items-center justify-center">
                <FiUsers className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-base text-foreground tracking-tight">RecruitFlow</h1>
                <p className="text-[10px] text-primary font-medium tracking-wider uppercase">AI Platform</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeScreen === item.id
              const isComplete = completedStages.includes(item.id)
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveScreen(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-[0.875rem] text-sm font-medium transition-all duration-200 group',
                    isActive ? 'bg-primary text-primary-foreground shadow-md' : 'text-foreground hover:bg-secondary'
                  )}
                >
                  <div className="relative">
                    <Icon className={cn('w-4 h-4', isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
                    {isComplete && !isActive && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center">
                        <FiCheck className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </div>
                  <span>{item.label}</span>
                  {isActive && <FiChevronRight className="w-3.5 h-3.5 ml-auto" />}
                </button>
              )
            })}
          </nav>

          <div className="p-4 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-medium">Pipeline Progress</p>
            <div className="space-y-1.5">
              {STAGE_ORDER.map((stage) => (
                <div key={stage} className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', completedStages.includes(stage) ? 'bg-emerald-500' : activeScreen === stage ? 'bg-primary' : 'bg-muted')} />
                  <span className="text-[11px] text-muted-foreground capitalize">{stage}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 min-h-screen overflow-y-auto">
          <div className="sticky top-0 z-10 bg-white/60 backdrop-blur-[16px] border-b border-white/20 px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">{screenTitles[activeScreen]}</h1>
                <p className="text-xs text-muted-foreground mt-0.5">AI-Powered Recruitment Pipeline - India / Bangalore</p>
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground cursor-pointer">Sample Data</Label>
                <Switch id="sample-toggle" checked={sampleMode} onCheckedChange={setSampleMode} />
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* ═══════════════════════════════════════════ */}
            {/* SCREEN: DASHBOARD                          */}
            {/* ═══════════════════════════════════════════ */}
            {activeScreen === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* LEFT: Active Jobs + Agent Status */}
                <div className="lg:col-span-2 space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2"><FiBriefcase className="w-5 h-5 text-primary" /> Active Jobs</h2>
                  {effectiveJob.title ? (
                    <GlassCard className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-base">{effectiveJob.title}</h3>
                          <p className="text-sm text-muted-foreground">{effectiveJob.department || 'No department'}</p>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><FiMapPin className="w-3 h-3" /> {effectiveJob.location || 'Remote'}</span>
                        <span className="flex items-center gap-1"><FiUsers className="w-3 h-3" /> {effectiveCandidates.length} candidates</span>
                      </div>
                      {effectiveJob.skills && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {effectiveJob.skills.split(',').slice(0, 5).map((s, i) => <SkillTag key={i} skill={s.trim()} />)}
                        </div>
                      )}
                    </GlassCard>
                  ) : (
                    <GlassCard className="p-8">
                      <EmptyState icon={FiBriefcase} title="No Active Jobs" description="Create a job description on the right to start your recruitment pipeline." />
                    </GlassCard>
                  )}

                  <GlassCard className="p-5">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><FiActivity className="w-4 h-4 text-primary" /> Agent Status</h3>
                    <div className="space-y-2">
                      {AGENT_INFO.map((agent) => {
                        const AgentIcon = agent.icon
                        const isActive = activeAgentId === agent.id
                        return (
                          <div key={agent.id} className="flex items-center gap-3 text-xs py-1.5">
                            <div className={cn('w-2 h-2 rounded-full flex-shrink-0', isActive ? 'bg-emerald-500 animate-pulse' : 'bg-muted')} />
                            <AgentIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-foreground">{agent.name}</span>
                              <span className="text-muted-foreground ml-1.5 hidden md:inline">- {agent.purpose}</span>
                            </div>
                            {isActive && <FiLoader className="w-3 h-3 text-primary animate-spin flex-shrink-0" />}
                          </div>
                        )
                      })}
                    </div>
                  </GlassCard>
                </div>

                {/* RIGHT: Job Description Form */}
                <div className="lg:col-span-3">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FiPlus className="w-5 h-5 text-primary" /> Job Description</h2>
                  <GlassCard className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Job Title *</Label>
                        <Input placeholder="e.g., Senior Full-Stack Engineer" className="bg-white/60 border-input rounded-[0.875rem] backdrop-blur-sm" value={sampleMode && !jobDescription.title ? SAMPLE_JOB.title : jobDescription.title} onChange={(e) => setJobDescription(prev => ({ ...prev, title: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Department</Label>
                        <Input placeholder="e.g., Engineering" className="bg-white/60 border-input rounded-[0.875rem] backdrop-blur-sm" value={sampleMode && !jobDescription.department ? SAMPLE_JOB.department : jobDescription.department} onChange={(e) => setJobDescription(prev => ({ ...prev, department: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Requirements</Label>
                      <Textarea placeholder="Describe the role requirements, responsibilities..." rows={4} className="bg-white/60 border-input rounded-[0.875rem] backdrop-blur-sm" value={sampleMode && !jobDescription.requirements ? SAMPLE_JOB.requirements : jobDescription.requirements} onChange={(e) => setJobDescription(prev => ({ ...prev, requirements: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Skills (comma-separated)</Label>
                      <Input placeholder="React, Node.js, TypeScript..." className="bg-white/60 border-input rounded-[0.875rem] backdrop-blur-sm" value={sampleMode && !jobDescription.skills ? SAMPLE_JOB.skills : jobDescription.skills} onChange={(e) => setJobDescription(prev => ({ ...prev, skills: e.target.value }))} />
                      {(sampleMode && !jobDescription.skills ? SAMPLE_JOB.skills : jobDescription.skills) && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(sampleMode && !jobDescription.skills ? SAMPLE_JOB.skills : jobDescription.skills).split(',').filter(Boolean).map((s, i) => <SkillTag key={i} skill={s.trim()} />)}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Experience (years)</Label>
                        <div className="flex items-center gap-2">
                          <Input type="number" placeholder="Min" className="bg-white/60 border-input rounded-[0.875rem] backdrop-blur-sm" value={sampleMode && !jobDescription.experienceMin ? SAMPLE_JOB.experienceMin : jobDescription.experienceMin} onChange={(e) => setJobDescription(prev => ({ ...prev, experienceMin: e.target.value }))} />
                          <span className="text-muted-foreground text-sm">to</span>
                          <Input type="number" placeholder="Max" className="bg-white/60 border-input rounded-[0.875rem] backdrop-blur-sm" value={sampleMode && !jobDescription.experienceMax ? SAMPLE_JOB.experienceMax : jobDescription.experienceMax} onChange={(e) => setJobDescription(prev => ({ ...prev, experienceMax: e.target.value }))} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Location</Label>
                        <Input placeholder="e.g., Bangalore, India" className="bg-white/60 border-input rounded-[0.875rem] backdrop-blur-sm" value={sampleMode && !jobDescription.location ? SAMPLE_JOB.location : jobDescription.location} onChange={(e) => setJobDescription(prev => ({ ...prev, location: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">CTC Range (INR per annum)</Label>
                      <div className="flex items-center gap-2">
                        <Input type="number" placeholder="e.g. 2500000" className="bg-white/60 border-input rounded-[0.875rem] backdrop-blur-sm" value={sampleMode && !jobDescription.salaryMin ? SAMPLE_JOB.salaryMin : jobDescription.salaryMin} onChange={(e) => setJobDescription(prev => ({ ...prev, salaryMin: e.target.value }))} />
                        <span className="text-muted-foreground text-sm">to</span>
                        <Input type="number" placeholder="e.g. 4500000" className="bg-white/60 border-input rounded-[0.875rem] backdrop-blur-sm" value={sampleMode && !jobDescription.salaryMax ? SAMPLE_JOB.salaryMax : jobDescription.salaryMax} onChange={(e) => setJobDescription(prev => ({ ...prev, salaryMax: e.target.value }))} />
                      </div>
                    </div>

                    {statusMessages['sourcing'] && <StatusMsg message={statusMessages['sourcing'].message} type={statusMessages['sourcing'].type} />}

                    <Button onClick={handleSourceCandidates} disabled={loadingStates['sourcing']} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-[0.875rem] h-11">
                      {loadingStates['sourcing'] ? <><FiLoader className="w-4 h-4 mr-2 animate-spin" /> Sourcing candidates from the web...</> : <><FiSearch className="w-4 h-4 mr-2" /> Source Candidates</>}
                    </Button>
                  </GlassCard>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/* SCREEN: SOURCING                           */}
            {/* ═══════════════════════════════════════════ */}
            {activeScreen === 'sourcing' && (
              <div className="space-y-4">
                {loadingStates['sourcing'] ? (
                  <LoadingOverlay message="Sourcing candidates from the web..." />
                ) : effectiveCandidates.length === 0 ? (
                  <EmptyState icon={FiSearch} title="No Candidates Sourced Yet" description="Enter a job description on the Dashboard and click Source Candidates to begin." />
                ) : (
                  <>
                    {searchSummary && (
                      <GlassCard className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FiTrendingUp className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">Search Summary</span>
                          </div>
                          {totalFound && <Badge variant="secondary">{totalFound} found</Badge>}
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">{renderMarkdown(searchSummary)}</div>
                      </GlassCard>
                    )}

                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">{effectiveCandidates.length} Candidates Found</h2>
                      {selectedForMatching.length > 0 && (
                        <Button onClick={handleMatchCandidates} disabled={loadingStates['matching']} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-[0.875rem]">
                          {loadingStates['matching'] ? <><FiLoader className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : <><FiBarChart2 className="w-4 h-4 mr-2" /> Match & Rank ({selectedForMatching.length})</>}
                        </Button>
                      )}
                    </div>

                    {statusMessages['matching'] && <StatusMsg message={statusMessages['matching'].message} type={statusMessages['matching'].type} />}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {effectiveCandidates.map((c) => {
                        const score = parseNum(c.relevance_score)
                        const isSelected = selectedForMatching.includes(c.name)
                        const isExpanded = expandedCandidate === c.name
                        return (
                          <GlassCard key={c.name} className={cn('transition-all duration-200', isSelected ? 'ring-2 ring-primary/50' : '')}>
                            <div className="p-5">
                              <div className="flex items-start gap-3">
                                <div className="pt-0.5">
                                  <Checkbox checked={isSelected} onCheckedChange={(checked) => {
                                    setSelectedForMatching(prev => checked ? [...prev, c.name] : prev.filter(n => n !== c.name))
                                  }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-1">
                                    <div>
                                      <h3 className="font-semibold text-sm">{c.name}</h3>
                                      <p className="text-xs text-muted-foreground">{c.current_title} at {c.company}</p>
                                    </div>
                                    <ScoreBadge score={score} />
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                                    <span className="flex items-center gap-1"><FiMapPin className="w-3 h-3" /> {c.location}</span>
                                    <span className="flex items-center gap-1"><FiClock className="w-3 h-3" /> {c.years_of_experience} yrs</span>
                                    <Badge variant="outline" className="text-[10px] py-0">{c.source_platform}</Badge>
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-2.5">
                                    {Array.isArray(c.key_skills) && c.key_skills.slice(0, 5).map((s, i) => <SkillTag key={i} skill={s} />)}
                                  </div>
                                  <button onClick={() => setExpandedCandidate(isExpanded ? null : c.name)} className="flex items-center gap-1 text-xs text-primary mt-3 hover:underline">
                                    {isExpanded ? <FiChevronDown className="w-3 h-3" /> : <FiChevronRight className="w-3 h-3" />}
                                    {isExpanded ? 'Less details' : 'More details'}
                                  </button>
                                  {isExpanded && (
                                    <div className="mt-3 pt-3 border-t border-border/50 space-y-2 text-xs">
                                      {c.relevance_notes && <div><span className="font-medium text-foreground">Notes:</span> <span className="text-muted-foreground">{c.relevance_notes}</span></div>}
                                      {c.contact_info && <div><span className="font-medium text-foreground">Contact:</span> <span className="text-muted-foreground">{c.contact_info}</span></div>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </GlassCard>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/* SCREEN: MATCHING                           */}
            {/* ═══════════════════════════════════════════ */}
            {activeScreen === 'matching' && (
              <div className="space-y-4">
                {loadingStates['matching'] ? (
                  <LoadingOverlay message="Analyzing candidate fit..." />
                ) : effectiveRanked.length === 0 ? (
                  <EmptyState icon={FiBarChart2} title="No Candidates Ranked Yet" description="Select candidates in the Sourcing tab and click Match & Rank to see rankings." />
                ) : (
                  <>
                    {matchingSummary && (
                      <GlassCard className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <FiTarget className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">Matching Summary</span>
                        </div>
                        <div className="text-sm text-muted-foreground">{renderMarkdown(matchingSummary)}</div>
                      </GlassCard>
                    )}

                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">Ranked Candidates</h2>
                      {selectedForScreening.length > 0 && (
                        <Button onClick={() => { markStageComplete('matching'); setActiveScreen('evaluation') }} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-[0.875rem]">
                          <FiCheckSquare className="w-4 h-4 mr-2" /> Run Screening ({selectedForScreening.length})
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {effectiveRanked.map((c) => {
                        const overallScore = parseNum(c.overall_score)
                        const skillsScore = parseNum(c.skills_match)
                        const expScore = parseNum(c.experience_match)
                        const cultureScore = parseNum(c.cultural_fit)
                        const isExpanded = expandedRanked === c.name
                        const isSelected = selectedForScreening.includes(c.name)

                        return (
                          <GlassCard key={c.name} className={cn('transition-all', isSelected ? 'ring-2 ring-primary/50' : '')}>
                            <div className="p-5">
                              <div className="flex items-center gap-4">
                                <Checkbox checked={isSelected} onCheckedChange={(checked) => {
                                  setSelectedForScreening(prev => checked ? [...prev, c.name] : prev.filter(n => n !== c.name))
                                  if (checked && !selectedForInterview.includes(c.name)) {
                                    setSelectedForInterview(prev => [...prev, c.name])
                                  }
                                }} />
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                  #{c.rank}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold">{c.name}</h3>
                                </div>
                                <ScoreBadge score={overallScore} large />
                              </div>

                              <div className="grid grid-cols-3 gap-4 mt-4">
                                <ScoreBar label="Skills Match" value={skillsScore} />
                                <ScoreBar label="Experience" value={expScore} />
                                <ScoreBar label="Cultural Fit" value={cultureScore} />
                              </div>

                              <button onClick={() => setExpandedRanked(isExpanded ? null : c.name)} className="flex items-center gap-1 text-xs text-primary mt-3 hover:underline">
                                {isExpanded ? <FiChevronDown className="w-3 h-3" /> : <FiChevronRight className="w-3 h-3" />}
                                {isExpanded ? 'Hide details' : 'View details'}
                              </button>

                              {isExpanded && (
                                <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                                  {c.scoring_reasoning && (
                                    <div>
                                      <p className="text-xs font-medium mb-1">AI Reasoning</p>
                                      <p className="text-xs text-muted-foreground">{c.scoring_reasoning}</p>
                                    </div>
                                  )}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-xs font-medium text-emerald-700 mb-1.5 flex items-center gap-1"><FiCheck className="w-3 h-3" /> Strengths</p>
                                      {Array.isArray(c.strengths) && c.strengths.map((s, i) => (
                                        <p key={i} className="text-xs text-muted-foreground ml-3 mb-1">- {s}</p>
                                      ))}
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-red-600 mb-1.5 flex items-center gap-1"><FiAlertCircle className="w-3 h-3" /> Concerns</p>
                                      {Array.isArray(c.concerns) && c.concerns.map((s, i) => (
                                        <p key={i} className="text-xs text-muted-foreground ml-3 mb-1">- {s}</p>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </GlassCard>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/* SCREEN: EVALUATION                         */}
            {/* ═══════════════════════════════════════════ */}
            {activeScreen === 'evaluation' && (
              <div>
                {evalCandidateNames.length === 0 ? (
                  <EmptyState icon={FiCheckSquare} title="No Candidates for Screening" description="Select candidates in the Matching tab and click Run Screening to begin evaluations." />
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1 space-y-2">
                      <h3 className="text-sm font-semibold mb-3">Candidate Queue</h3>
                      {evalCandidateNames.map((name) => {
                        const hasResult = !!evaluationResults[name]
                        const hasEval = evaluationResults[name]?.evaluation
                        return (
                          <button key={name} onClick={() => setActiveEvalCandidate(name)} className={cn('w-full text-left px-3 py-2.5 rounded-[0.875rem] text-sm transition-all', effectiveEvalCandidate === name ? 'bg-primary text-primary-foreground' : 'bg-white/50 hover:bg-white/80')}>
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate">{name}</span>
                              {hasEval ? <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Complete</Badge> : hasResult ? <Badge className="bg-amber-100 text-amber-700 text-[10px]">Questions</Badge> : <Badge variant="outline" className="text-[10px]">Pending</Badge>}
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    <div className="lg:col-span-3">
                      {statusMessages['evaluation'] && <div className="mb-4"><StatusMsg message={statusMessages['evaluation'].message} type={statusMessages['evaluation'].type} /></div>}

                      {loadingStates[`eval-${effectiveEvalCandidate}`] ? (
                        <LoadingOverlay message="Conducting screening evaluation..." />
                      ) : evaluationResults[effectiveEvalCandidate]?.evaluation ? (
                        <GlassCard className="p-6 space-y-5">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">Evaluation Scorecard - {effectiveEvalCandidate}</h3>
                            <Badge className={cn('text-sm px-3 py-1', evaluationResults[effectiveEvalCandidate]?.evaluation?.recommendation?.toLowerCase()?.includes('pass') ? 'bg-emerald-100 text-emerald-700' : evaluationResults[effectiveEvalCandidate]?.evaluation?.recommendation?.toLowerCase()?.includes('fail') ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>
                              {evaluationResults[effectiveEvalCandidate]?.evaluation?.recommendation ?? 'Pending'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                              { label: 'Technical', score: evaluationResults[effectiveEvalCandidate]?.evaluation?.technical_score },
                              { label: 'Problem Solving', score: evaluationResults[effectiveEvalCandidate]?.evaluation?.problem_solving_score },
                              { label: 'Communication', score: evaluationResults[effectiveEvalCandidate]?.evaluation?.communication_score },
                              { label: 'Overall', score: evaluationResults[effectiveEvalCandidate]?.evaluation?.overall_score },
                            ].map((item) => (
                              <div key={item.label} className="text-center p-3 bg-muted/50 rounded-[0.875rem]">
                                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                                <p className="text-2xl font-bold text-foreground">{item.score ?? '-'}</p>
                              </div>
                            ))}
                          </div>
                          {evaluationResults[effectiveEvalCandidate]?.evaluation?.confidence_level && (
                            <p className="text-xs text-muted-foreground">Confidence: {evaluationResults[effectiveEvalCandidate]?.evaluation?.confidence_level}</p>
                          )}
                          {evaluationResults[effectiveEvalCandidate]?.evaluation?.summary && (
                            <div><p className="text-xs font-medium mb-1">Summary</p><div className="text-sm text-muted-foreground">{renderMarkdown(evaluationResults[effectiveEvalCandidate]?.evaluation?.summary ?? '')}</div></div>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-medium text-emerald-700 mb-2 flex items-center gap-1"><FiCheck className="w-3 h-3" /> Strengths</p>
                              {Array.isArray(evaluationResults[effectiveEvalCandidate]?.evaluation?.strengths) && evaluationResults[effectiveEvalCandidate]!.evaluation!.strengths.map((s, i) => <p key={i} className="text-xs text-muted-foreground ml-3 mb-1">- {s}</p>)}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1"><FiX className="w-3 h-3" /> Areas of Concern</p>
                              {Array.isArray(evaluationResults[effectiveEvalCandidate]?.evaluation?.areas_of_concern) && evaluationResults[effectiveEvalCandidate]!.evaluation!.areas_of_concern.map((s, i) => <p key={i} className="text-xs text-muted-foreground ml-3 mb-1">- {s}</p>)}
                            </div>
                          </div>
                        </GlassCard>
                      ) : evaluationResults[effectiveEvalCandidate]?.assessment_questions && Array.isArray(evaluationResults[effectiveEvalCandidate]?.assessment_questions) && (evaluationResults[effectiveEvalCandidate]?.assessment_questions?.length ?? 0) > 0 ? (
                        <GlassCard className="p-6 space-y-5">
                          <h3 className="font-semibold text-lg">Screening Questions - {effectiveEvalCandidate}</h3>
                          <p className="text-sm text-muted-foreground">Record the candidate&apos;s answers below, then submit for AI evaluation.</p>
                          <ScrollArea className="max-h-[500px]">
                            <div className="space-y-4 pr-4">
                              {(evaluationResults[effectiveEvalCandidate]?.assessment_questions ?? []).map((q, i) => (
                                <div key={i} className="p-4 bg-muted/30 rounded-[0.875rem] space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px]">{q.category}</Badge>
                                    <span className="text-xs text-muted-foreground">Q{q.question_number ?? i + 1}</span>
                                  </div>
                                  <p className="text-sm font-medium">{q.question}</p>
                                  {q.expected_answer_guidance && <p className="text-xs text-muted-foreground italic">Guidance: {q.expected_answer_guidance}</p>}
                                  <Textarea placeholder="Enter candidate's answer..." rows={2} className="bg-white/60 border-input rounded-[0.875rem] backdrop-blur-sm text-sm" value={evalAnswers[`${effectiveEvalCandidate}-${i}`] ?? ''} onChange={(e) => setEvalAnswers(prev => ({ ...prev, [`${effectiveEvalCandidate}-${i}`]: e.target.value }))} />
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                          <Button onClick={() => handleSubmitEvalAnswers(effectiveEvalCandidate)} disabled={loadingStates[`eval-${effectiveEvalCandidate}`]} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-[0.875rem]">
                            {loadingStates[`eval-${effectiveEvalCandidate}`] ? <><FiLoader className="w-4 h-4 mr-2 animate-spin" /> Evaluating...</> : <><FiCheckSquare className="w-4 h-4 mr-2" /> Submit Answers for Evaluation</>}
                          </Button>
                        </GlassCard>
                      ) : (
                        <GlassCard className="p-8">
                          <EmptyState icon={FiCheckSquare} title={`Ready to Screen ${effectiveEvalCandidate}`} description="Click below to generate screening assessment questions." />
                          <div className="flex justify-center mt-4">
                            <Button onClick={() => handleEvaluateCandidate(effectiveEvalCandidate)} disabled={loadingStates[`eval-${effectiveEvalCandidate}`]} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-[0.875rem]">
                              {loadingStates[`eval-${effectiveEvalCandidate}`] ? <><FiLoader className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><FiZap className="w-4 h-4 mr-2" /> Run Screening</>}
                            </Button>
                          </div>
                        </GlassCard>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/* SCREEN: SCHEDULING                         */}
            {/* ═══════════════════════════════════════════ */}
            {activeScreen === 'scheduling' && (
              <div>
                {schedCandidateNames.length === 0 ? (
                  <EmptyState icon={FiCalendar} title="No Candidates for Scheduling" description="Complete screening evaluations first, then candidates will appear here for interview scheduling." />
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1 space-y-2">
                      <h3 className="text-sm font-semibold mb-3">Candidates</h3>
                      {schedCandidateNames.map((name) => {
                        const hasResult = !!schedulingResults[name]
                        return (
                          <button key={name} onClick={() => setActiveSchedCandidate(name)} className={cn('w-full text-left px-3 py-2.5 rounded-[0.875rem] text-sm transition-all', effectiveSchedCandidate === name ? 'bg-primary text-primary-foreground' : 'bg-white/50 hover:bg-white/80')}>
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate">{name}</span>
                              {hasResult ? <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Scheduled</Badge> : <Badge variant="outline" className="text-[10px]">Unscheduled</Badge>}
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    <div className="lg:col-span-3 space-y-4">
                      {statusMessages['scheduling'] && <StatusMsg message={statusMessages['scheduling'].message} type={statusMessages['scheduling'].type} />}

                      {loadingStates[`sched-${effectiveSchedCandidate}`] ? (
                        <LoadingOverlay message="Scheduling interviews..." />
                      ) : schedulingResults[effectiveSchedCandidate] ? (
                        <div className="space-y-4">
                          <GlassCard className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                              <FiCheck className="w-5 h-5 text-emerald-600" />
                              <h3 className="font-semibold">Interview Scheduled</h3>
                              <Badge className="bg-emerald-100 text-emerald-700">{schedulingResults[effectiveSchedCandidate]?.scheduling_status ?? 'Completed'}</Badge>
                            </div>
                            {schedulingResults[effectiveSchedCandidate]?.summary && <div className="text-sm text-muted-foreground">{renderMarkdown(schedulingResults[effectiveSchedCandidate].summary)}</div>}
                          </GlassCard>
                          {Array.isArray(schedulingResults[effectiveSchedCandidate]?.scheduled_interviews) && schedulingResults[effectiveSchedCandidate].scheduled_interviews.map((interview, i) => (
                            <GlassCard key={i} className="p-5">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                <div><p className="text-xs text-muted-foreground">Candidate</p><p className="font-medium">{interview.candidate_name}</p></div>
                                <div><p className="text-xs text-muted-foreground">Interviewer</p><p className="font-medium">{interview.interviewer_email}</p></div>
                                <div><p className="text-xs text-muted-foreground">Date & Time</p><p className="font-medium">{interview.date} {interview.time}</p></div>
                                <div><p className="text-xs text-muted-foreground">Duration</p><p className="font-medium">{interview.duration}</p></div>
                                <div><p className="text-xs text-muted-foreground">Status</p><Badge variant="outline">{interview.status}</Badge></div>
                                {interview.meeting_link && <div><p className="text-xs text-muted-foreground">Meeting</p><a href={interview.meeting_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs"><FiExternalLink className="w-3 h-3" /> Join</a></div>}
                              </div>
                            </GlassCard>
                          ))}
                          {Array.isArray(schedulingResults[effectiveSchedCandidate]?.emails_sent) && (schedulingResults[effectiveSchedCandidate]?.emails_sent?.length ?? 0) > 0 && (
                            <GlassCard className="p-4">
                              <h4 className="text-sm font-medium mb-2 flex items-center gap-2"><FiMail className="w-4 h-4 text-primary" /> Emails Sent</h4>
                              {schedulingResults[effectiveSchedCandidate].emails_sent.map((email, i) => (
                                <div key={i} className="flex items-center gap-3 text-xs py-1.5">
                                  <FiCheck className="w-3 h-3 text-emerald-500" />
                                  <span className="text-muted-foreground">{email.recipient}</span>
                                  <span className="text-foreground">{email.subject}</span>
                                  <Badge variant="outline" className="text-[10px]">{email.status}</Badge>
                                </div>
                              ))}
                            </GlassCard>
                          )}
                        </div>
                      ) : (
                        <GlassCard className="p-6 space-y-5">
                          <h3 className="font-semibold text-lg flex items-center gap-2"><FiCalendar className="w-5 h-5 text-primary" /> Schedule Interview - {effectiveSchedCandidate}</h3>

                          {/* Email Section - Prominent */}
                          <div className="p-4 bg-primary/5 rounded-[0.875rem] border border-primary/10 space-y-4">
                            <p className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5"><FiMail className="w-3.5 h-3.5" /> Email Configuration</p>

                            {/* Candidate Email */}
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Candidate Email *</Label>
                              <Input type="email" placeholder="candidate@email.com" className="bg-white/80 border-input rounded-[0.875rem] backdrop-blur-sm" value={schedForm.candidateEmail || getSchedCandidateEmail(effectiveSchedCandidate)} onChange={(e) => setSchedForm(prev => ({ ...prev, candidateEmail: e.target.value }))} />
                              {!schedForm.candidateEmail && getSchedCandidateEmail(effectiveSchedCandidate) && (
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1"><FiCheck className="w-3 h-3 text-emerald-500" /> Auto-filled from candidate profile</p>
                              )}
                            </div>

                            {/* Interviewer Emails - Multi Add */}
                            <div className="space-y-2">
                              <Label className="text-xs font-medium">Interviewer Email(s) *</Label>
                              {validInterviewerEmails.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {validInterviewerEmails.map((email) => (
                                    <span key={email} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 border border-border rounded-full text-xs font-medium">
                                      <FiMail className="w-3 h-3 text-muted-foreground" />
                                      {email}
                                      <button onClick={() => handleRemoveInterviewerEmail(email)} className="text-muted-foreground hover:text-red-500 transition-colors ml-0.5">
                                        <FiX className="w-3 h-3" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Input
                                  type="email"
                                  placeholder="Enter interviewer email and press Add"
                                  className="bg-white/80 border-input rounded-[0.875rem] backdrop-blur-sm flex-1"
                                  value={newInterviewerEmail}
                                  onChange={(e) => setNewInterviewerEmail(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddInterviewerEmail() } }}
                                />
                                <Button type="button" variant="outline" size="sm" onClick={handleAddInterviewerEmail} disabled={!newInterviewerEmail.trim()} className="rounded-[0.875rem] px-4 h-10 border-primary/30 text-primary hover:bg-primary/10">
                                  <FiPlus className="w-4 h-4 mr-1" /> Add
                                </Button>
                              </div>
                              <p className="text-[10px] text-muted-foreground">Add multiple interviewer emails for panel interviews. Press Enter or click Add.</p>
                            </div>
                          </div>

                          {/* Schedule Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Preferred Date Start</Label>
                              <Input type="date" className="bg-white/60 border-input rounded-[0.875rem] backdrop-blur-sm" value={schedForm.dateStart} onChange={(e) => setSchedForm(prev => ({ ...prev, dateStart: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Preferred Date End</Label>
                              <Input type="date" className="bg-white/60 border-input rounded-[0.875rem] backdrop-blur-sm" value={schedForm.dateEnd} onChange={(e) => setSchedForm(prev => ({ ...prev, dateEnd: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Time Window Start</Label>
                              <Input type="time" className="bg-white/60 border-input rounded-[0.875rem] backdrop-blur-sm" value={schedForm.timeStart} onChange={(e) => setSchedForm(prev => ({ ...prev, timeStart: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Time Window End</Label>
                              <Input type="time" className="bg-white/60 border-input rounded-[0.875rem] backdrop-blur-sm" value={schedForm.timeEnd} onChange={(e) => setSchedForm(prev => ({ ...prev, timeEnd: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Duration</Label>
                              <Select value={schedForm.duration} onValueChange={(val) => setSchedForm(prev => ({ ...prev, duration: val }))}>
                                <SelectTrigger className="bg-white/60 border-input rounded-[0.875rem] backdrop-blur-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="30">30 minutes</SelectItem>
                                  <SelectItem value="45">45 minutes</SelectItem>
                                  <SelectItem value="60">60 minutes</SelectItem>
                                  <SelectItem value="90">90 minutes</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Interview Type</Label>
                              <Select value={schedForm.interviewType} onValueChange={(val) => setSchedForm(prev => ({ ...prev, interviewType: val }))}>
                                <SelectTrigger className="bg-white/60 border-input rounded-[0.875rem] backdrop-blur-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Technical">Technical</SelectItem>
                                  <SelectItem value="Behavioral">Behavioral</SelectItem>
                                  <SelectItem value="Panel">Panel</SelectItem>
                                  <SelectItem value="Cultural Fit">Cultural Fit</SelectItem>
                                  <SelectItem value="HR Round">HR Round</SelectItem>
                                  <SelectItem value="System Design">System Design</SelectItem>
                                  <SelectItem value="DSA Round">DSA Round</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <Button onClick={() => handleScheduleInterview(effectiveSchedCandidate)} disabled={loadingStates[`sched-${effectiveSchedCandidate}`]} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-[0.875rem] h-11">
                            {loadingStates[`sched-${effectiveSchedCandidate}`] ? <><FiLoader className="w-4 h-4 mr-2 animate-spin" /> Scheduling...</> : <><FiCalendar className="w-4 h-4 mr-2" /> Schedule Interview</>}
                          </Button>
                        </GlassCard>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/* SCREEN: ANALYSIS                           */}
            {/* ═══════════════════════════════════════════ */}
            {activeScreen === 'analysis' && (
              <div>
                {analysisCandidateNames.length === 0 ? (
                  <EmptyState icon={FiFileText} title="No Interviews to Analyze" description="Schedule interviews first, then paste transcripts here for AI-powered analysis." />
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1 space-y-2">
                      <h3 className="text-sm font-semibold mb-3">Candidates</h3>
                      {analysisCandidateNames.map((name) => {
                        const hasResult = !!analysisResults[name]
                        return (
                          <button key={name} onClick={() => setActiveAnalysisCandidate(name)} className={cn('w-full text-left px-3 py-2.5 rounded-[0.875rem] text-sm transition-all', effectiveAnalysisCandidate === name ? 'bg-primary text-primary-foreground' : 'bg-white/50 hover:bg-white/80')}>
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate">{name}</span>
                              {hasResult ? <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Analyzed</Badge> : <Badge variant="outline" className="text-[10px]">Pending</Badge>}
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    <div className="lg:col-span-3 space-y-4">
                      {statusMessages['analysis'] && <StatusMsg message={statusMessages['analysis'].message} type={statusMessages['analysis'].type} />}

                      {loadingStates[`analysis-${effectiveAnalysisCandidate}`] ? (
                        <LoadingOverlay message="Analyzing interview performance..." />
                      ) : analysisResults[effectiveAnalysisCandidate] ? (
                        <div className="space-y-4">
                          <GlassCard className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-semibold text-lg">Interview Analysis - {analysisResults[effectiveAnalysisCandidate]?.candidate_name || effectiveAnalysisCandidate}</h3>
                              <div className="flex items-center gap-3">
                                <Badge className={cn('text-sm px-3 py-1', analysisResults[effectiveAnalysisCandidate]?.recommendation?.toLowerCase()?.includes('hire') && !analysisResults[effectiveAnalysisCandidate]?.recommendation?.toLowerCase()?.includes('no') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
                                  {analysisResults[effectiveAnalysisCandidate]?.recommendation ?? 'Pending'}
                                </Badge>
                                {analysisResults[effectiveAnalysisCandidate]?.confidence_percentage && <span className="text-xs text-muted-foreground">{analysisResults[effectiveAnalysisCandidate]?.confidence_percentage}% confidence</span>}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 mb-6">
                              <div className="text-center p-4 bg-muted/50 rounded-[0.875rem] min-w-[80px]">
                                <p className="text-3xl font-bold text-foreground">{analysisResults[effectiveAnalysisCandidate]?.overall_score ?? '-'}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">Overall Score</p>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <p className="text-xs font-medium mb-2">Competency Scores</p>
                              {Array.isArray(analysisResults[effectiveAnalysisCandidate]?.competency_scores) && analysisResults[effectiveAnalysisCandidate]!.competency_scores.map((cs, i) => (
                                <div key={i} className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-foreground font-medium">{cs.dimension}</span>
                                    <span className="text-muted-foreground">{cs.score}</span>
                                  </div>
                                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                    <div className={cn('h-full rounded-full transition-all duration-500', scoreColor(parseNum(cs.score)))} style={{ width: `${Math.min(100, parseNum(cs.score))}%` }} />
                                  </div>
                                  {cs.justification && <p className="text-[11px] text-muted-foreground">{cs.justification}</p>}
                                </div>
                              ))}
                            </div>
                          </GlassCard>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <GlassCard className="p-5">
                              <p className="text-xs font-medium text-emerald-700 mb-2 flex items-center gap-1"><FiCheck className="w-3 h-3" /> Strengths</p>
                              {Array.isArray(analysisResults[effectiveAnalysisCandidate]?.strengths) && analysisResults[effectiveAnalysisCandidate]!.strengths.map((s, i) => <p key={i} className="text-xs text-muted-foreground mb-1.5 flex items-start gap-2"><FiCheck className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />{s}</p>)}
                            </GlassCard>
                            <GlassCard className="p-5">
                              <p className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1"><FiAlertCircle className="w-3 h-3" /> Concerns</p>
                              {Array.isArray(analysisResults[effectiveAnalysisCandidate]?.concerns) && analysisResults[effectiveAnalysisCandidate]!.concerns.map((s, i) => <p key={i} className="text-xs text-muted-foreground mb-1.5 flex items-start gap-2"><FiX className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />{s}</p>)}
                            </GlassCard>
                          </div>

                          {Array.isArray(analysisResults[effectiveAnalysisCandidate]?.notable_quotes) && (analysisResults[effectiveAnalysisCandidate]?.notable_quotes?.length ?? 0) > 0 && (
                            <GlassCard className="p-5">
                              <p className="text-xs font-medium mb-3 flex items-center gap-1"><FiMessageSquare className="w-3 h-3 text-primary" /> Notable Quotes</p>
                              <div className="space-y-2">
                                {analysisResults[effectiveAnalysisCandidate]!.notable_quotes.map((q, i) => (
                                  <div key={i} className="pl-3 border-l-2 border-primary/30 text-xs text-muted-foreground italic">&ldquo;{q}&rdquo;</div>
                                ))}
                              </div>
                            </GlassCard>
                          )}

                          {analysisResults[effectiveAnalysisCandidate]?.summary && (
                            <GlassCard className="p-5">
                              <p className="text-xs font-medium mb-2">Summary</p>
                              <div className="text-sm text-muted-foreground">{renderMarkdown(analysisResults[effectiveAnalysisCandidate]!.summary)}</div>
                            </GlassCard>
                          )}
                        </div>
                      ) : (
                        <GlassCard className="p-6 space-y-4">
                          <h3 className="font-semibold text-lg flex items-center gap-2"><FiFileText className="w-5 h-5 text-primary" /> Interview Analysis - {effectiveAnalysisCandidate}</h3>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Interview Transcript / Notes</Label>
                            <Textarea placeholder="Paste interview transcript, notes, or key observations here..." rows={10} className="bg-white/60 border-input rounded-[0.875rem] backdrop-blur-sm" value={transcriptInput} onChange={(e) => setTranscriptInput(e.target.value)} />
                          </div>
                          <Button onClick={() => handleAnalyzeInterview(effectiveAnalysisCandidate)} disabled={loadingStates[`analysis-${effectiveAnalysisCandidate}`] || !transcriptInput.trim()} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-[0.875rem] h-11">
                            {loadingStates[`analysis-${effectiveAnalysisCandidate}`] ? <><FiLoader className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : <><FiFileText className="w-4 h-4 mr-2" /> Analyze Interview</>}
                          </Button>
                        </GlassCard>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/* SCREEN: OFFERS                             */}
            {/* ═══════════════════════════════════════════ */}
            {activeScreen === 'offers' && (
              <div className="space-y-6">
                <Tabs defaultValue="negotiation" className="w-full">
                  <TabsList className="w-full grid grid-cols-2 bg-muted/50 rounded-[0.875rem]">
                    <TabsTrigger value="negotiation" className="rounded-[0.875rem]">Compensation Negotiation</TabsTrigger>
                    <TabsTrigger value="offer" className="rounded-[0.875rem]">Offer Letter</TabsTrigger>
                  </TabsList>

                  {/* ── NEGOTIATION TAB ── */}
                  <TabsContent value="negotiation" className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Form */}
                      <GlassCard className="p-6 space-y-4">
                        <h3 className="font-semibold flex items-center gap-2"><FiTrendingUp className="w-4 h-4 text-primary" /> Compensation Analysis</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">CTC Budget Min (INR/annum) *</Label>
                            <Input type="number" placeholder="2500000" className="bg-white/60 border-input rounded-[0.875rem] backdrop-blur-sm" value={negForm.budgetMin} onChange={(e) => setNegForm(prev => ({ ...prev, budgetMin: e.target.value }))} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">CTC Budget Max (INR/annum) *</Label>
                            <Input type="number" placeholder="4500000" className="bg-white/60 border-input rounded-[0.875rem] backdrop-blur-sm" value={negForm.budgetMax} onChange={(e) => setNegForm(prev => ({ ...prev, budgetMax: e.target.value }))} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Candidate Expected CTC (INR/annum)</Label>
                          <Input type="number" placeholder="3500000" className="bg-white/60 border-input rounded-[0.875rem] backdrop-blur-sm" value={negForm.candidateExpected} onChange={(e) => setNegForm(prev => ({ ...prev, candidateExpected: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Benefits Package</Label>
                          <Input placeholder="PF, Gratuity, Medical Insurance, Meal Coupons..." className="bg-white/60 border-input rounded-[0.875rem] backdrop-blur-sm" value={negForm.benefits} onChange={(e) => setNegForm(prev => ({ ...prev, benefits: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">ESOPs / Equity</Label>
                          <Input placeholder="e.g., 5000 ESOPs vesting over 4 years" className="bg-white/60 border-input rounded-[0.875rem] backdrop-blur-sm" value={negForm.equity} onChange={(e) => setNegForm(prev => ({ ...prev, equity: e.target.value }))} />
                        </div>

                        {statusMessages['negotiation'] && <StatusMsg message={statusMessages['negotiation'].message} type={statusMessages['negotiation'].type} />}

                        <Button onClick={handleNegotiation} disabled={loadingStates['negotiation'] || !negForm.budgetMin || !negForm.budgetMax} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-[0.875rem] h-11">
                          {loadingStates['negotiation'] ? <><FiLoader className="w-4 h-4 mr-2 animate-spin" /> Researching market compensation...</> : <><FiDollarSign className="w-4 h-4 mr-2" /> Start Negotiation Analysis</>}
                        </Button>
                      </GlassCard>

                      {/* Results */}
                      <div className="space-y-4">
                        {loadingStates['negotiation'] ? (
                          <LoadingOverlay message="Researching market compensation..." />
                        ) : negotiationResult ? (
                          <>
                            {negotiationResult.market_analysis && (
                              <GlassCard className="p-5">
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><FiBarChart2 className="w-4 h-4 text-primary" /> Market Analysis</h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div><p className="text-xs text-muted-foreground">Role</p><p className="font-medium">{negotiationResult.market_analysis.role}</p></div>
                                  <div><p className="text-xs text-muted-foreground">Location</p><p className="font-medium">{negotiationResult.market_analysis.location}</p></div>
                                  <div><p className="text-xs text-muted-foreground">Market Median</p><p className="font-semibold text-primary">{negotiationResult.market_analysis.market_median}</p></div>
                                  <div><p className="text-xs text-muted-foreground">Market Range</p><p className="font-medium">{negotiationResult.market_analysis.market_range_low} - {negotiationResult.market_analysis.market_range_high}</p></div>
                                </div>
                                {Array.isArray(negotiationResult.market_analysis.data_sources) && negotiationResult.market_analysis.data_sources.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-border/50">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Data Sources</p>
                                    <div className="flex flex-wrap gap-1">
                                      {negotiationResult.market_analysis.data_sources.map((s, i) => <Badge key={i} variant="outline" className="text-[10px]">{s}</Badge>)}
                                    </div>
                                  </div>
                                )}
                              </GlassCard>
                            )}

                            {negotiationResult.recommended_offer && (
                              <GlassCard className="p-5 border-2 border-primary/20">
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><FiAward className="w-4 h-4 text-primary" /> Recommended Offer</h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div><p className="text-xs text-muted-foreground">Base Salary</p><p className="font-semibold text-lg">{negotiationResult.recommended_offer.base_salary}</p></div>
                                  <div><p className="text-xs text-muted-foreground">Bonus</p><p className="font-medium">{negotiationResult.recommended_offer.bonus}</p></div>
                                  <div><p className="text-xs text-muted-foreground">Equity</p><p className="font-medium">{negotiationResult.recommended_offer.equity}</p></div>
                                  <div><p className="text-xs text-muted-foreground">Total Compensation</p><p className="font-semibold text-primary text-lg">{negotiationResult.recommended_offer.total_compensation}</p></div>
                                </div>
                                {negotiationResult.recommended_offer.reasoning && (
                                  <div className="mt-3 pt-3 border-t border-border/50">
                                    <p className="text-xs text-muted-foreground">{negotiationResult.recommended_offer.reasoning}</p>
                                  </div>
                                )}
                              </GlassCard>
                            )}

                            {Array.isArray(negotiationResult.talking_points) && negotiationResult.talking_points.length > 0 && (
                              <GlassCard className="p-5">
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><FiMessageSquare className="w-4 h-4 text-primary" /> Talking Points</h4>
                                <div className="space-y-1.5">
                                  {negotiationResult.talking_points.map((tp, i) => (
                                    <p key={i} className="text-xs text-muted-foreground flex items-start gap-2"><FiChevronRight className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />{tp}</p>
                                  ))}
                                </div>
                              </GlassCard>
                            )}

                            {Array.isArray(negotiationResult.counter_offer_scenarios) && negotiationResult.counter_offer_scenarios.length > 0 && (
                              <GlassCard className="p-5">
                                <h4 className="text-sm font-semibold mb-3">Counter-Offer Scenarios</h4>
                                <div className="space-y-3">
                                  {negotiationResult.counter_offer_scenarios.map((s, i) => (
                                    <div key={i} className="p-3 bg-muted/30 rounded-[0.875rem]">
                                      <p className="text-xs font-medium text-foreground">{s.scenario}</p>
                                      <p className="text-xs text-muted-foreground mt-1">{s.response}</p>
                                      <p className="text-xs font-medium text-primary mt-1">Adjusted: {s.adjusted_offer}</p>
                                    </div>
                                  ))}
                                </div>
                              </GlassCard>
                            )}

                            {negotiationResult.negotiation_summary && (
                              <GlassCard className="p-5">
                                <h4 className="text-sm font-semibold mb-2">Negotiation Summary</h4>
                                <div className="text-sm text-muted-foreground">{renderMarkdown(negotiationResult.negotiation_summary)}</div>
                              </GlassCard>
                            )}
                          </>
                        ) : (
                          <GlassCard className="p-8">
                            <EmptyState icon={FiDollarSign} title="No Analysis Yet" description="Enter your budget range and click Start Negotiation Analysis to get market data and recommendations." />
                          </GlassCard>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* ── OFFER LETTER TAB ── */}
                  <TabsContent value="offer" className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Form */}
                      <GlassCard className="p-6 space-y-4">
                        <h3 className="font-semibold flex items-center gap-2"><FiFileText className="w-4 h-4 text-primary" /> Offer Letter Details</h3>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Candidate Name *</Label>
                          <Input placeholder="Full name" className="bg-white/60 border-input rounded-[0.875rem] backdrop-blur-sm" value={offerForm.candidateName} onChange={(e) => setOfferForm(prev => ({ ...prev, candidateName: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Position *</Label>
                            <Input placeholder="Job title" className="bg-white/60 border-input rounded-[0.875rem] backdrop-blur-sm" value={offerForm.position} onChange={(e) => setOfferForm(prev => ({ ...prev, position: e.target.value }))} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Department</Label>
                            <Input placeholder="Department" className="bg-white/60 border-input rounded-[0.875rem] backdrop-blur-sm" value={offerForm.department} onChange={(e) => setOfferForm(prev => ({ ...prev, department: e.target.value }))} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Start Date</Label>
                            <Input type="date" className="bg-white/60 border-input rounded-[0.875rem] backdrop-blur-sm" value={offerForm.startDate} onChange={(e) => setOfferForm(prev => ({ ...prev, startDate: e.target.value }))} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Acceptance Deadline</Label>
                            <Input type="date" className="bg-white/60 border-input rounded-[0.875rem] backdrop-blur-sm" value={offerForm.acceptanceDeadline} onChange={(e) => setOfferForm(prev => ({ ...prev, acceptanceDeadline: e.target.value }))} />
                          </div>
                        </div>

                        {statusMessages['offer'] && <StatusMsg message={statusMessages['offer'].message} type={statusMessages['offer'].type} />}

                        <Button onClick={handleDraftOffer} disabled={loadingStates['offer'] || !offerForm.candidateName || !offerForm.position} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-[0.875rem] h-11">
                          {loadingStates['offer'] ? <><FiLoader className="w-4 h-4 mr-2 animate-spin" /> Drafting offer letter...</> : <><FiFileText className="w-4 h-4 mr-2" /> Draft Offer Letter</>}
                        </Button>
                      </GlassCard>

                      {/* Results */}
                      <div className="space-y-4">
                        {loadingStates['offer'] ? (
                          <LoadingOverlay message="Drafting offer letter..." />
                        ) : offerResult ? (
                          <>
                            {offerResult.metadata && (
                              <GlassCard className="p-5">
                                <h4 className="text-sm font-semibold mb-3">Offer Details</h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div><p className="text-xs text-muted-foreground">Candidate</p><p className="font-medium">{offerResult.metadata.candidate_name}</p></div>
                                  <div><p className="text-xs text-muted-foreground">Position</p><p className="font-medium">{offerResult.metadata.position}</p></div>
                                  <div><p className="text-xs text-muted-foreground">Department</p><p className="font-medium">{offerResult.metadata.department}</p></div>
                                  <div><p className="text-xs text-muted-foreground">Start Date</p><p className="font-medium">{offerResult.metadata.start_date}</p></div>
                                  <div><p className="text-xs text-muted-foreground">Total Compensation</p><p className="font-semibold text-primary">{offerResult.metadata.total_compensation}</p></div>
                                  <div><p className="text-xs text-muted-foreground">Acceptance Deadline</p><p className="font-medium">{offerResult.metadata.acceptance_deadline}</p></div>
                                </div>
                              </GlassCard>
                            )}

                            {offerResult.letter_content && (
                              <GlassCard className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="text-sm font-semibold">Offer Letter Preview</h4>
                                  {Array.isArray(offerResult.artifact_files) && offerResult.artifact_files.length > 0 && offerResult.artifact_files[0]?.file_url && (
                                    <a href={offerResult.artifact_files[0].file_url} target="_blank" rel="noopener noreferrer">
                                      <Button variant="outline" size="sm" className="rounded-[0.875rem]">
                                        <FiDownload className="w-3.5 h-3.5 mr-1.5" /> Download
                                      </Button>
                                    </a>
                                  )}
                                </div>
                                <div className="bg-white p-6 rounded-lg border border-border/50 max-h-[500px] overflow-y-auto">
                                  {renderMarkdown(offerResult.letter_content)}
                                </div>
                              </GlassCard>
                            )}

                            {Array.isArray(offerResult.compliance_notes) && offerResult.compliance_notes.length > 0 && (
                              <GlassCard className="p-5">
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><FiAlertCircle className="w-4 h-4 text-amber-500" /> Compliance Notes</h4>
                                {offerResult.compliance_notes.map((note, i) => (
                                  <p key={i} className="text-xs text-muted-foreground mb-1.5 flex items-start gap-2"><FiAlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />{note}</p>
                                ))}
                              </GlassCard>
                            )}
                          </>
                        ) : (
                          <GlassCard className="p-8">
                            <EmptyState icon={FiFileText} title="No Offer Letter Yet" description="Fill in the candidate details and click Draft Offer Letter to generate a professional offer document." />
                          </GlassCard>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}
