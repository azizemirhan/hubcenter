from rest_framework.exceptions import APIException

class CompanyRequiredException(APIException):
    status_code = 400
    default_detail = 'Active company selection is required.'

class TwoFactorRequiredException(APIException):
    status_code = 403
    default_detail = 'Two-factor authentication is required.'
