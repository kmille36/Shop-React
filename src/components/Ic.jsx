import {
  ShoppingCart,
  ShoppingBag,
  Heart,
  HeartCrack,
  Wallet,
  User,
  Home,
  Search,
  Moon,
  Sun,
  Eye,
  Trash2,
  X,
  Zap,
  CreditCard,
  Banknote,
  Building2,
  Gift,
  Ribbon,
  Ticket,
  Package,
  Truck,
  Smartphone,
  Lock,
  History,
  Frown,
  Send,
  MessageCircle,
  Bot,
  Lightbulb,
  Hourglass,
  BarChart3,
  ArrowUp,
  Sparkles,
  FileText,
  Gem,
  Medal,
  LogOut,
  Save,
  Pencil,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Hand,
  Star,
  ArrowRight,
  Ban,
  PartyPopper,
  Mail,
  BookOpen,
  Camera,
  AtSign,
  Phone,
  Clock,
  Coins,
  RefreshCcw,
  Laptop,
  Smile,
  HelpCircle,
  ClipboardList,
  PenLine,
  Headphones,
  Mouse,
  Watch,
  Tablet,
  Glasses,
  Gamepad2,
  Check,
  Bell,
  Tag,
  BadgePercent,
  TrendingUp,
  Receipt,
  Target,
  Trophy,
  Crown,
  ShieldCheck,
  CandlestickChart,
  ArrowUpRight,
  ArrowDownRight,
  ArrowDown,
  ShoppingBasket,
  Store,
  PiggyBank,
  ImageIcon,
  Clapperboard,
  Film,
  Mic,
  Radio,
  Tv,
  Music,
  BookMarked,
  Pen,
  PenTool,
  Palette,
  Paintbrush,
  Info,
  Play,
  Circle,
  Settings,
  Users
} from 'lucide-react'

// Map each legacy emoji to a real Lucide SVG icon
const MAP = {
  '🛒': ShoppingCart, '🛍️': ShoppingBag, '🛍': ShoppingBag, '🛒️': ShoppingCart,
  '❤️': Heart, '❤': Heart, '🤍': Heart, '💔': HeartCrack,
  '👛': Wallet, '👤': User, '🏠': Home, '🔍': Search,
  '🌙': Moon, '☀️': Sun, '☀': Sun, '👁️': Eye, '👁': Eye,
  '🗑️': Trash2, '🗑': Trash2, '✕': X, '✖': X, 'x': X,
  '⚡': Zap, '💳': CreditCard, '💵': Banknote, '🏦': Building2,
  '🎁': Gift, '🎀': Ribbon, '🎟️': Ticket, '🎟': Ticket,
  '📦': Package, '🚚': Truck, '📱': Smartphone, '🔐': Lock,
  '🕘': History, '😕': Frown, '😕️': Frown, '➤': Send,
  '💬': MessageCircle, '🤖': Bot, '💡': Lightbulb, '💸': Banknote,
  '⏳': Hourglass, '📊': BarChart3, '⬆️': ArrowUp, '⬆': ArrowUp,
  '✨': Sparkles, '📝': FileText, '💎': Gem,
  '🥇': Medal, '🥈': Medal, '🥉': Medal,
  '🚪': LogOut, '💾': Save, '✏️': Pencil, '✏': Pencil,
  '📍': MapPin, '✅': CheckCircle2, '⚠️': AlertTriangle, '⚠': AlertTriangle,
  '👋': Hand, '⭐': Star, '→': ArrowRight, '★': Star, '☆': Star,
  '🚫': Ban, '🎉': PartyPopper, '📬': Mail,
  '📘': BookOpen, '📸': Camera, '🐦': AtSign,
  '📞': Phone, '✉️': Mail, '✉': Mail, '🕐': Clock,
  '💰': Coins, '🔄': RefreshCcw, '💻': Laptop,
  '😊': Smile, '🤔': HelpCircle, '📋': ClipboardList, '✍️': PenLine, '✍': PenLine,
  '🎧': Headphones, '🖱️': Mouse, '🖱': Mouse, '⌚': Watch,
  '📲': Tablet, '📖': BookOpen, '🥽': Glasses, '🎮': Gamepad2,
  '✓': Check, '✔': Check, '✔️': Check,
  '🔔': Bell, '💠': Gem, '🏷️': Tag, '🏷': Tag,
  '💯': BadgePercent, '📈': TrendingUp, '🧾': Receipt,
  '🎯': Target, '🏆': Trophy, '👑': Crown, '🛡️': ShieldCheck, '🛡': ShieldCheck,
  '💰️': Coins, '🪙': Coins, '💹': CandlestickChart,
  '📤': ArrowUpRight, '📥': ArrowDownRight, '⬇️': ArrowDown, '⬇': ArrowDown,
  '🧺': ShoppingBasket, '🏪': Store, '🐷': PiggyBank,
  '📷': Camera, '🖼️': ImageIcon, '🎬': Clapperboard, '🎥': Film,
  '🎤': Mic, '📻': Radio, '📺': Tv, '🎵': Music, '🎶': Music,
  '📎': Tag, '🔖': BookMarked, '🖊️': Pen, '🖋️': PenTool,
  '🎨': Palette, '🖌️': Paintbrush,
  'ℹ️': Info, 'ℹ': Info, '▶️': Play, '▶': Play, '○': Circle, '⭕': Circle,
  '👥': Users, '⚙️': Settings, '⚙': Settings, '🛡️': ShieldCheck,
}

// Fallback: a neutral dot so nothing ever renders blank
const Fallback = (props) => <Circle size={props.size || 18} strokeWidth={2} className={`ic ${props.className || ''}`} />

export default function Ic({ e, size = 18, className = '', ...rest }) {
  const Cmp = MAP[e] || Fallback
  return <Cmp size={size} className={`ic ${className}`} strokeWidth={2} {...rest} />
}

// Convenience: stars row (filled/outline) for ratings
export function Stars({ value = 0, size = 16, className = '' }) {
  return (
    <span className={`stars-ic ${className}`} aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? 'on' : 'off'}
          fill={i <= Math.round(value) ? 'currentColor' : 'none'}
          strokeWidth={1.5}
        />
      ))}
    </span>
  )
}

// ===== Emoji detection helpers (used by Emj) =====
export const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{24C2}\u{203C}\u{2049}\u{2122}\u{231A}\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{FE0F}\u{200D}]/gu

export function hasEmoji(str) {
  return typeof str === 'string' && EMOJI_RE.test(str)
}
