'use client'

import { useEditor, EditorContent, Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import { StarterKit } from '@tiptap/starter-kit'
import { TextStyle, Color } from '@tiptap/extension-text-style'
import { Highlight } from '@tiptap/extension-highlight'
import { Placeholder } from '@tiptap/extensions'
import { Image } from '@tiptap/extension-image'
import { useCallback, useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useDropzone } from 'react-dropzone'
import ReactCrop, { Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import NextImage from 'next/image'

export interface RichTextEditorHandle {
    insertContent: (text: string) => void
    setContent: (content: string) => void
}

interface RichTextEditorProps {
    content: string
    onChange: (content: string) => void
    placeholder?: string
}

interface ImageAdjustments {
    brightness: number
    contrast: number
    saturation: number
    blur: number
    hue: number
    sepia: number
}

interface AdjustmentHistory {
    past: ImageAdjustments[]
    present: ImageAdjustments
    future: ImageAdjustments[]
}

interface ImageCropDialogProps {
    imageUrl: string
    onCrop: (croppedImage: Blob, adjustments: ImageAdjustments) => void
    onCancel: () => void
}

const PRESET_FILTERS = {
    'Normal': { brightness: 100, contrast: 100, saturation: 100, blur: 0, hue: 0, sepia: 0 },
    'Vintage': { brightness: 110, contrast: 85, saturation: 75, blur: 0, hue: 0, sepia: 50 },
    'Summer': { brightness: 110, contrast: 110, saturation: 130, blur: 0, hue: 20, sepia: 0 },
    'Dramatic': { brightness: 90, contrast: 140, saturation: 90, blur: 0, hue: 0, sepia: 20 },
    'Cool': { brightness: 100, contrast: 100, saturation: 90, blur: 0, hue: 180, sepia: 0 },
} as const

const ImageCropDialog = ({ imageUrl, onCrop, onCancel }: ImageCropDialogProps) => {
    const [crop, setCrop] = useState<Crop>({ unit: '%', width: 90, height: 90, x: 5, y: 5 })
    const [adjustmentHistory, setAdjustmentHistory] = useState<AdjustmentHistory>({
        past: [],
        present: PRESET_FILTERS.Normal,
        future: [],
    })
    const imageRef = useRef<HTMLImageElement>(null)

    const pushToHistory = (next: ImageAdjustments) =>
        setAdjustmentHistory(prev => ({ past: [...prev.past, prev.present], present: next, future: [] }))

    const handleCrop = async () => {
        if (!imageRef.current) return
        const canvas = document.createElement('canvas')
        const scaleX = imageRef.current.naturalWidth / imageRef.current.width
        const scaleY = imageRef.current.naturalHeight / imageRef.current.height
        canvas.width = crop.width * scaleX
        canvas.height = crop.height * scaleY
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const a = adjustmentHistory.present
        ctx.filter = `brightness(${a.brightness}%) contrast(${a.contrast}%) saturate(${a.saturation}%) blur(${a.blur}px) hue-rotate(${a.hue}deg) sepia(${a.sepia}%)`
        ctx.drawImage(imageRef.current, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, crop.width * scaleX, crop.height * scaleY)
        canvas.toBlob(blob => { if (blob) onCrop(blob, adjustmentHistory.present) }, 'image/webp', 0.9)
    }

    const a = adjustmentHistory.present
    const filterStyle = `brightness(${a.brightness}%) contrast(${a.contrast}%) saturate(${a.saturation}%) blur(${a.blur}px) hue-rotate(${a.hue}deg) sepia(${a.sepia}%)`

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Edit Image</h2>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
                    <ReactCrop crop={crop} onChange={c => setCrop(c)}>
                        <NextImage ref={imageRef as any} src={imageUrl} alt="Crop preview" width={800} height={600}
                            style={{ filter: filterStyle, maxWidth: '100%', height: 'auto' }} unoptimized />
                    </ReactCrop>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-2">Filters</p>
                            <div className="grid grid-cols-2 gap-1.5">
                                {Object.entries(PRESET_FILTERS).map(([name, vals]) => (
                                    <button key={name} onClick={() => pushToHistory(vals)}
                                        className={`px-2 py-1.5 rounded-sm text-sm ${JSON.stringify(vals) === JSON.stringify(a) ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-sm">Cancel</button>
                            <button onClick={handleCrop} className="px-3 py-1.5 text-sm bg-gray-900 text-white hover:bg-gray-700 rounded-sm">Apply & Insert</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
function RichTextEditor({ content, onChange, placeholder = 'Write your entry...' }, ref) {
    const [cropImage, setCropImage] = useState<string | null>(null)

    const editor = useEditor({
        extensions: [
            // Tiptap v3 StarterKit now bundles Link and Underline; keep v2 behaviour.
            StarterKit.configure({ link: false, underline: false }),
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            Placeholder.configure({ placeholder }),
            Image.configure({ HTMLAttributes: { class: 'rounded-lg max-w-full h-auto my-4' } }),
        ],
        content,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-hidden min-h-[60vh] font-serif text-gray-900 dark:text-zinc-100 leading-relaxed',
            },
        },
        onUpdate: ({ editor }: { editor: Editor }) => {
            onChange(editor.getHTML())
        },
    })

    useImperativeHandle(ref, () => ({
        insertContent: (text: string) => {
            editor?.chain().focus().insertContent(text).run()
        },
        setContent: (nextContent: string) => {
            editor?.commands.setContent(nextContent, { emitUpdate: false })
        },
    }), [editor])

    useEffect(() => {
        if (!editor) return

        const currentContent = editor.getHTML()
        if (content !== currentContent) {
            editor.commands.setContent(content, { emitUpdate: false })
        }
    }, [content, editor])

    const handleImageUpload = useCallback(async (file: File) => {
        const imageUrl = URL.createObjectURL(file)
        setCropImage(imageUrl)
    }, [])

    const handleCroppedImage = useCallback(async (croppedBlob: Blob, adjustments: ImageAdjustments) => {
        try {
            const formData = new FormData()
            formData.append('file', croppedBlob)
            formData.append('brightness', adjustments.brightness.toString())
            formData.append('contrast', adjustments.contrast.toString())
            formData.append('saturation', adjustments.saturation.toString())
            const response = await fetch('/api/upload', { method: 'POST', body: formData })
            if (!response.ok) throw new Error('Upload failed')
            const { url } = await response.json()
            editor?.chain().focus().setImage({ src: url }).run()
        } catch (error) {
            console.error('Failed to upload image:', error)
        } finally {
            setCropImage(null)
        }
    }, [editor])

    const { getRootProps, isDragActive } = useDropzone({
        accept: { 'image/*': [] },
        noClick: true,
        onDrop: (acceptedFiles) => {
            if (acceptedFiles?.[0]) handleImageUpload(acceptedFiles[0])
        },
    })

    if (!editor) return null

    return (
        <div className="relative">
            {cropImage && (
                <ImageCropDialog
                    imageUrl={cropImage}
                    onCrop={handleCroppedImage}
                    onCancel={() => { setCropImage(null); URL.revokeObjectURL(cropImage) }}
                />
            )}

            <BubbleMenu
                editor={editor}
                options={{ placement: 'top' }}
                className="flex items-center gap-0.5 px-1.5 py-1 bg-gray-900 rounded-lg shadow-xl"
            >
                <BubbleButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    title="Bold"
                >
                    <span className="font-bold text-sm">B</span>
                </BubbleButton>
                <BubbleButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    title="Italic"
                >
                    <span className="italic text-sm">I</span>
                </BubbleButton>
                <BubbleButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive('strike')}
                    title="Strikethrough"
                >
                    <span className="line-through text-sm">S</span>
                </BubbleButton>
                <BubbleButton
                    onClick={() => editor.chain().focus().toggleHighlight().run()}
                    isActive={editor.isActive('highlight')}
                    title="Highlight"
                >
                    <span className="text-sm px-0.5 bg-yellow-300 text-gray-900 rounded-xs">H</span>
                </BubbleButton>
                <div className="w-px h-4 bg-white/20 mx-1" />
                <BubbleButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive('heading', { level: 1 })}
                    title="Heading 1"
                >
                    <span className="text-xs font-semibold">H1</span>
                </BubbleButton>
                <BubbleButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    title="Heading 2"
                >
                    <span className="text-xs font-semibold">H2</span>
                </BubbleButton>
                <div className="w-px h-4 bg-white/20 mx-1" />
                <BubbleButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    title="Bullet list"
                >
                    <span className="text-sm">•—</span>
                </BubbleButton>
            </BubbleMenu>

            <div {...getRootProps()} className="bg-white rounded-2xl border border-sage-light shadow-xs min-h-[320px] p-6 mt-4 relative">
                <p className="text-xs uppercase tracking-widest font-medium text-forest opacity-60 mb-3">
                    {"Today's Entry"}
                </p>
                <EditorContent editor={editor} />
                {isDragActive && (
                    <div className="absolute inset-0 bg-blue-50 border-2 border-blue-400 border-dashed rounded-lg flex items-center justify-center pointer-events-none">
                        <p className="text-blue-500 text-sm font-medium">Drop image to insert</p>
                    </div>
                )}
            </div>
        </div>
    )
})

function BubbleButton({
    onClick,
    isActive,
    title,
    children,
}: {
    onClick: () => void
    isActive: boolean
    title: string
    children: React.ReactNode
}) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={`px-2 py-1 rounded transition-colors ${
                isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
        >
            {children}
        </button>
    )
}

export default RichTextEditor
