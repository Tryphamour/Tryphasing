# Domain Model

## Card
- id
- name
- image
- description
- setId (FK)

## Set
- id
- name
- image (image du pack)
- totalCards

## Viewer
- id
- twitchId
- username
- createdAt

## Collection
- id
- viewerId
- cardId
- quantity

Important :
Les statistiques doivent compter uniquement les cartes DISTINCTES.
