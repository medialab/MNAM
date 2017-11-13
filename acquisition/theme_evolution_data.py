import csvkit
from collections import defaultdict


def create_by_creationdate(collection):
	'''
	'''
	tag_date = defaultdict(lambda: 0)

	with open(collection, 'r') as f:
		reader = csvkit.DictReader(f)
		for row in reader:
			c_date = row['Year creation']
			c_tag = row['tag_thema'].split(', ')
			if not c_date.isdigit() or int(c_date) < 1868:
				pass
			else:
				if len(c_tag) > 1:
					for t in c_tag:
						tag_date[(t, c_date)] += 1
				else:
					tag_date[(c_tag[0], c_date)] += 1

	# Write output file
	with open('theme_creationDate.csv', 'w') as f:
		writer = csvkit.DictWriter(f, fieldnames=['Theme', 'Year creation', 'Weight'])
		writer.writeheader()
		for k in tag_date:
			output_row = {'Theme': k[0], 'Year creation': '01/01/%s'%k[1], 'Weight': tag_date[k]}
			writer.writerow(output_row)


def create_by_acquisitiondate_acquisitionmode(collection):
	'''
	'''
	tag_acq_date = defaultdict(lambda: 0)

	with open(collection, 'r') as f:
		reader = csvkit.DictReader(f)
		for row in reader:
			c_date = row['Year acquisition']
			c_tag = row['tag_thema'].split(', ')
			c_mode = row['Mode acquisition (new categories)']
			if not c_date.isdigit() or c_mode == '' or int(c_date) < 1868:
				pass
			else:
				if len(c_tag) > 1:
					for t in c_tag:
						tag_acq_date[(t, c_mode, c_date)] += 1
				else:
					tag_acq_date[(c_tag[0], c_mode, c_date)] += 1

	# Write output file
	with open('theme_acqDate_acqMode_date.csv', 'w') as f:
		writer = csvkit.DictWriter(f, fieldnames=['Theme', 'Year acquisition', 'Mode acquisition (new categories)', 'Weight'])
		writer.writeheader()
		for k in tag_acq_date:
			output_row = {'Theme': k[0], 'Year acquisition': '01/01/%s'%k[2], 'Mode acquisition (new categories)': k[1], 'Weight': tag_acq_date[k]}
			writer.writerow(output_row)

	
def create_by_creationdate_artist(collection):
	'''
	'''
	tag_artist_date = defaultdict(lambda: 0)

	with open(collection, 'r') as f:
		reader = csvkit.DictReader(f)
		for row in reader:
			c_date = row['Year creation']
			c_tag = row['tag_thema'].split(', ')
			c_name = row['name']
			if not c_date.isdigit() or int(c_date) < 1868:
				pass
			if len(c_tag) > 1:
				for t in c_tag:
					tag_artist_date[(t, c_name, c_date)] += 1
			else:
				tag_artist_date[(c_tag[0], c_name, c_date)] += 1

	# Write output file
	with open('theme_author_date.csv', 'w') as f:
		writer = csvkit.DictWriter(f, fieldnames=['Theme', 'Year creation', 'Name', 'Weight'])
		writer.writeheader()
		for k in tag_artist_date:
			output_row = {'Theme': k[0], 'Year creation': '01/01/%s'%k[2], 'Name': k[1], 'Weight': tag_artist_date[k]}
			writer.writerow(output_row)


def create_by_creationdate_small(collection, filters):
	tag_date = defaultdict(lambda: 0)

	with open(collection, 'r') as f:
		reader = csvkit.DictReader(f)
		for row in reader:
			c_date = row['Year creation']
			c_tag = row['tag_thema'].split(', ')
			
			if not c_date.isdigit() or int(c_date) < 1868:
				pass
			else:
				if len(c_tag) > 1:
					for t in c_tag:
						if t in filters:
							tag_date[(t, c_date)] += 1
				else:
					if c_tag[0] in filters:
						tag_date[(c_tag[0], c_date)] += 1

	# Write output file
	with open('theme_creationDate_small.csv', 'w') as f:
		writer = csvkit.DictWriter(f, fieldnames=['Theme', 'Year creation', 'Weight'])
		writer.writeheader()
		for k in tag_date:
			output_row = {'Theme': k[0], 'Year creation': '01/01/%s'%k[1], 'Weight': tag_date[k]}
			writer.writerow(output_row)



if __name__ == '__main__':

	collection = 'tagged.csv'

	filters = ['abstraction', 'corps', 'paysage', 'language']
	#create_by_creationdate(collection)
	#create_by_acquisitiondate_acquisitionmode(collection)
	#create_by_creationdate_artist(collection)
	create_by_creationdate_small(collection, filters)

	

