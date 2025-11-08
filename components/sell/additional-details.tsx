import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface AdditionalDetailsProps {
  youtubeUrl: string
  websiteUrl: string
  tags: string[]
  features: string[]
  onYoutubeUrlChange: (value: string) => void
  onWebsiteUrlChange: (value: string) => void
  onTagsChange: (value: string[]) => void
  onFeaturesChange: (value: string[]) => void
}

export function AdditionalDetails({ 
  youtubeUrl, 
  websiteUrl, 
  tags, 
  features, 
  onYoutubeUrlChange, 
  onWebsiteUrlChange, 
  onTagsChange, 
  onFeaturesChange 
}: AdditionalDetailsProps) {
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const newTag = (e.target as HTMLInputElement).value.trim()
      if (newTag && !tags.includes(newTag)) {
        onTagsChange([...tags, newTag])
      }
      (e.target as HTMLInputElement).value = ''
    }
  }

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove))
  }

  const handleFeatureKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const newFeature = (e.target as HTMLInputElement).value.trim()
      if (newFeature && !features.includes(newFeature)) {
        onFeaturesChange([...features, newFeature])
      }
      (e.target as HTMLInputElement).value = ''
    }
  }

  const removeFeature = (featureToRemove: string) => {
    onFeaturesChange(features.filter(feature => feature !== featureToRemove))
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="youtubeUrl">YouTube URL</Label>
        <Input id="youtubeUrl" value={youtubeUrl} onChange={(e) => onYoutubeUrlChange(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="websiteUrl">Website URL</Label>
        <Input id="websiteUrl" value={websiteUrl} onChange={(e) => onWebsiteUrlChange(e.target.value)} placeholder="https://example.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <div key={tag} className="flex items-center gap-1 bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm">
              {tag}
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeTag(tag)}>
                &times;
              </Button>
            </div>
          ))}
        </div>
        <Input id="tags" onKeyDown={handleTagKeyDown} placeholder="Add a tag and press Enter" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="features">Features</Label>
        <div className="flex flex-wrap gap-2">
          {features.map(feature => (
            <div key={feature} className="flex items-center gap-1 bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm">
              {feature}
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFeature(feature)}>
                &times;
              </Button>
            </div>
          ))}
        </div>
        <Input id="features" onKeyDown={handleFeatureKeyDown} placeholder="Add a feature and press Enter" />
      </div>
    </div>
  )
}