import utils
import numpy as np

from TextFields import TextFields

from sklearn.feature_extraction.text import CountVectorizer
from sklearn.feature_extraction.text import TfidfVectorizer



def count_theme(documents):
	'''	
		Simple count frequency of words (theme)
	'''
	themes = [t.theme for t in documents]

	dtm = CountVectorizer().fit_transform(themes)

	print(dtm.shape)


def tfidf_theme(documents):
	'''
		Computes TF-IDF for theme field
		Export result in a csv file 
	'''
	themes = [t.theme for t in documents]
	vec = TfidfVectorizer()
	
	# Get tfidf matrix and vocab
	dtm = vec.fit_transform(themes).toarray()
	vocab = vec.get_feature_names()

	# Stack vocab and tfidf matrix and save
	dtm = np.vstack((vocab, dtm))
	with open('tfidf_theme.csv', 'wb') as f:
		np.savetxt(f, dtm, comments='')



if __name__ == '__main__':
	# Open csv 
	filename = '/home/akira/Documents/Dev/Datasprint/textfields.csv'
	documents = utils.get_all_doc(filename)

	# Prepare documents for scikit-learn
	documents = [t.join_tokens() for t in documents]

	# For every fields computes word frequencies
	count_theme(documents)


	# For every fields, compute tfidf

	# Display top ten words for every fields

