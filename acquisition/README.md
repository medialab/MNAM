Some scripts have dependencies to data which are either stored in a mongodb to be set-up first (see ../README.md) or produced by other scripts in this repository.

## List of acquisitions

acquisitions_list.py generates acquisitions.csv which contains those variables : 

- _id
- title
- domaine
- mode_acquisition
- mode_acquisition_cleaned
- acquisition_date
- creation_date
- creation_year
- gender
- artist_ids
- artist_names
- artist_nationalities
- artist_birthdeath
- birthdeath
- birthCity
- birthState
- birthCountry
- birthYear
- deathCity
- deathState
- deathCountry
- deathYear

Data treatments concerns : acquisition mode, creation date, artist birth/death date and place.
See the script for more info.
Artists' nationality treatments has been droped for lack of time, see the script to see the atempt and below for a simpler cleaning.

## Exhibitions statistics

artwors_exhibitions_exploration.py is based on a the *artworks_exhibitions.csv* produced by another group and *unique_artworks.csv* (see *modules/unique_artworks.py* which re-used the cleaning methods developed for acquisitions list).

*artworks_in_exhibitions.csv* : list of artworks exhibited with exhibitions number and list

- nb_exhibitions
- exhibitions
- artist_names

*artists_in_exhibitions.csv* : list of artists with exhibitions stats 

- nb_exhibitions
- nb_artworks
- nb_artworks_in_exposition
- exhibitions

## Exhibitions statistics by Exhibition types

A more precise set of statistics about artisits ni exhbitions can be generated from the network produced by the exhibition group.

The script *authors_ranked_by_exhibitions.py* needs *final_network.csv* and *../modules/authors.csv* and outputs a *artworks_in_exhibitions.csv* with one line by artists : 

- nb_exhibitions
- nb_artwork_exposed
- nb_exhibitions_M34
- nb_exhibitions_M30
- nb_exhibitions_M20
- nb_artworks_in_exhibitions
- name

## cleaning nationalities

*nationality_patch.py* outputs a patch wihch cleans the nationality field of artist objects. It simply extracts the nationality.ies dropping information about time. 
Beware, this cleaning method is quick and durty and probably produces parsing errors.

## text analysis
*textfields.py* simply exports some text field from the mongo database. The outputed CSV was used to do some NLP see *word_frequency.py*.

## arwork tagging
*artwork_tagging.py* creates a map that link a keyword to a tag by reading the csv generated from gephi


