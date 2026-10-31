import { useAuth } from '../auth/auth-context'
import JobCard from '../components/jobs/JobCard'
import PageHeader from '../components/PageHeader'
import { previewWeather, resetDatabase, sendWeatherAlerts, skipDay } from '../lib/staging'

function JobsPage() {
  const { signOut } = useAuth()

  return (
    <>
      <PageHeader title="Jobs" />
      <div className="grid gap-6 md:grid-cols-2">
        <JobCard
          title="Reset database"
          description="Deletes all data, admins included, and loads the seed data again. Log back in with the bootstrap admin's email and password."
          run={() => resetDatabase().then(signOut)}
        />
        <JobCard
          title="Skip a day"
          description="Moves every watering, plant, post and plant-sitting period one day into the past, as if a day passed, then sends watering reminders for plants due today, whatever the hour."
          run={skipDay}
        />
        <JobCard
          title="Send weather alerts"
          description="Sends a weather notification now to every user with a location, even on a mild day."
          run={sendWeatherAlerts}
        />
        <JobCard
          title="Show rain"
          description="Every user sees the rain animation for 2 minutes, whatever the real weather. Open apps pick it up within 30 seconds."
          run={() => previewWeather('rain')}
        />
        <JobCard
          title="Show wind"
          description="Every user sees the wind animation for 2 minutes, whatever the real weather. Open apps pick it up within 30 seconds."
          run={() => previewWeather('wind')}
        />
        <JobCard
          title="Show snow"
          description="Every user sees the snow animation for 2 minutes, whatever the real weather. Open apps pick it up within 30 seconds."
          run={() => previewWeather('snow')}
        />
      </div>
    </>
  )
}

export default JobsPage
