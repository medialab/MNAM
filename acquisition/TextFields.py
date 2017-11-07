

class TextFields(object):
	def __init__(self, theme, ico, mov, mat):
		self._theme = theme
		self._ico = ico
		self._mov = mov
		self._mat = mat

	@property
	def theme(self):
		return self._theme

	@theme.setter
	def theme(self, theme):
		self._theme = theme

	@property
	def ico(self):
		return self._ico

	@ico.setter
	def ico(self, ico):
		self._ico = ico

	@property
	def mov(self):
		return self._mov

	@mov.setter
	def mov(self, mov):
		self._mov = mov

	@property
	def mat(self):
		return self._mat

	@mat.setter
	def mat(self, mat):
		self._mat = mat
