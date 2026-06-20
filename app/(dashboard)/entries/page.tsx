import EntriesClient from './client'

export default function EntriesPage() {
    return (
        <div className="px-6 pt-6 pb-4 lg:max-w-3xl lg:mx-auto overflow-y-auto">
            <h1
                className="text-3xl font-semibold text-forest"
                style={{ fontFamily: 'var(--font-playfair)' }}
            >
                All Entries
            </h1>
            <p
                className="text-forest-muted text-sm mt-1"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
                Your complete journal history
            </p>

            <EntriesClient />
        </div>
    )
}
