import EntriesClient from './client'

export default function EntriesPage() {
    return (
        <div className="px-6 pt-6 pb-4 lg:max-w-4xl lg:mx-auto">
            <div className="mb-6">
                <h1
                    className="text-2xl font-semibold text-forest"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                >
                    All Entries
                </h1>
            </div>
            <EntriesClient />
        </div>
    )
}
