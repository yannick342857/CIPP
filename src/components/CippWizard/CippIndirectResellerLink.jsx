import { useEffect, useMemo, useState } from 'react'
import { Alert, Autocomplete, Box, Skeleton, Stack, TextField, Typography } from '@mui/material'
import { ApiGetCall } from '../../api/ApiCall'
import { CippWizardStepButtons } from './CippWizardStepButtons'
import { CippCopyToClipBoard } from '../CippComponents/CippCopyToClipboard'

export const CippIndirectResellerLink = (props) => {
  const { formControl, currentStep, onPreviousStep, onNextStep } = props
  const [selectedProvider, setSelectedProvider] = useState(null)

  const linkData = ApiGetCall({
    url: '/api/ListResellerRelationshipLink',
    queryKey: 'ListResellerRelationshipLink',
  })

  const inviteUrl = linkData.data?.inviteUrl ?? null
  const indirectProviders = linkData.data?.indirectProviders ?? []
  const inviteUrlError = linkData.data?.inviteUrlError ?? null

  const finalUrl = useMemo(() => {
    if (!inviteUrl) return null
    if (!selectedProvider) return inviteUrl
    // Append the indirect provider ID before the # fragment
    const hashIndex = inviteUrl.indexOf('#')
    const base = hashIndex !== -1 ? inviteUrl.slice(0, hashIndex) : inviteUrl
    const hash = hashIndex !== -1 ? inviteUrl.slice(hashIndex) : ''
    return `${base}&indirectCSPId=${selectedProvider.id}${hash}`
  }, [inviteUrl, selectedProvider])

  const providerOptions = useMemo(
    () =>
      indirectProviders.map((p) => ({
        label: p.name,
        id: p.id,
        mpnId: p.mpnId,
        location: p.location,
      })),
    [indirectProviders]
  )

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" gutterBottom>
          Indirect Reseller Relationship Link
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Generate an invite link to send to a customer so they can authorize you as their indirect
          reseller. This does <strong>not</strong> add the tenant to CIPP — it only provides the
          Microsoft Admin Portal invitation link.
        </Typography>
      </Box>

      {linkData.isFetching && (
        <Stack spacing={2}>
          {/* Indirect provider dropdown skeleton */}
          <Skeleton variant="rounded" height={56} />
          {/* Link field skeleton */}
          <Stack spacing={0.5}>
            <Skeleton variant="text" width={80} />
            <Skeleton variant="rounded" height={40} />
            <Skeleton variant="text" width="60%" />
          </Stack>
        </Stack>
      )}

      {linkData.isError && (
        <Alert severity="error">
          Failed to load relationship link from the Partner Center API. Ensure your CIPP application
          has the required Partner Center permissions.
        </Alert>
      )}

      {inviteUrlError && !linkData.isError && <Alert severity="warning">{inviteUrlError}</Alert>}

      {!linkData.isFetching && !linkData.isError && inviteUrl && (
        <>
          {indirectProviders.length > 0 && (
            <Autocomplete
              options={providerOptions}
              value={selectedProvider}
              onChange={(_, value) => setSelectedProvider(value)}
              getOptionLabel={(option) => option.label}
              renderOption={(renderProps, option) => (
                <li {...renderProps} key={option.id}>
                  <Stack>
                    <Typography variant="body2">{option.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      MPN ID: {option.mpnId} · {option.location}
                    </Typography>
                  </Stack>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Indirect Provider (optional)"
                  placeholder="Select to include a direct reseller in the invite"
                  helperText="If you resell through an indirect provider (e.g. PAX8), select them here to include their ID in the link."
                />
              )}
            />
          )}

          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Invite Link</strong>
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                fullWidth
                value={finalUrl}
                inputProps={{ readOnly: true }}
                size="small"
                sx={{ fontFamily: 'monospace' }}
              />
              <CippCopyToClipBoard text={finalUrl} />
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Send this link to your customer. When they follow it, they will be linked to your
              reseller account in the Microsoft Admin Portal.
            </Typography>
          </Box>

          <Alert severity="info">
            There is no automatic confirmation when the customer accepts this invite. You can verify
            the relationship in Partner Center once the customer has completed the process.
          </Alert>
        </>
      )}

      <CippWizardStepButtons
        currentStep={currentStep}
        onPreviousStep={onPreviousStep}
        onNextStep={onNextStep}
        formControl={formControl}
        noSubmitButton
      />
    </Stack>
  )
}
